import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CalendarEntry, CalendarEntryDocument } from '../plans/schemas/calendar-entry.schema';
import { google } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
  private oauth2Client;

  constructor(
    private configService: ConfigService,
    @InjectModel(CalendarEntry.name) private calendarModel: Model<CalendarEntryDocument>,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI') || 'http://localhost:3000/google-calendar/callback';

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  // Générer l'URL d'autorisation Google
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events', // Créer/modifier des événements
      'https://www.googleapis.com/auth/calendar.readonly', // Lire les événements
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  // Échanger le code d'autorisation contre des tokens
  async getTokensFromCode(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      throw new BadRequestException('Failed to exchange authorization code');
    }
  }

  // Synchroniser une entrée de calendrier avec Google Calendar
  async syncToGoogleCalendar(
    calendarEntryId: string,
    accessToken: string,
    refreshToken?: string,
  ) {
    const entry = await this.calendarModel.findById(calendarEntryId);
    if (!entry) {
      throw new BadRequestException('Calendar entry not found');
    }

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Créer la date/heure de l'événement
    const [hours, minutes] = entry.scheduledTime.split(':');
    const startDateTime = new Date(entry.scheduledDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + 1); // Durée de 1 heure par défaut

    const event = {
      summary: `📱 Publication ${entry.platform}`,
      description: `Publication planifiée sur ${entry.platform} depuis IdeaSpark\n\nPlan ID: ${entry.planId}\nContent Block ID: ${entry.contentBlockId}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 },
        ],
      },
      colorId: '9', // Bleu pour les publications
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      return {
        success: true,
        eventId: response.data.id || undefined,
        eventLink: response.data.htmlLink || undefined,
      };
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      throw new BadRequestException('Failed to sync with Google Calendar');
    }
  }

  // Synchroniser toutes les entrées d'un plan
  async syncPlanToGoogleCalendar(
    planId: string,
    userId: string,
    accessToken: string,
    refreshToken?: string,
  ) {
    const entries = await this.calendarModel.find({ planId, userId });
    
    const results: Array<{
      entryId: string;
      success: boolean;
      eventId?: string;
      eventLink?: string;
      error?: string;
    }> = [];
    
    for (const entry of entries) {
      try {
        const result = await this.syncToGoogleCalendar(
          entry._id.toString(),
          accessToken,
          refreshToken,
        );
        results.push({ entryId: entry._id.toString(), ...result });
      } catch (error: any) {
        results.push({ 
          entryId: entry._id.toString(), 
          success: false, 
          error: error.message 
        });
      }
    }

    return {
      total: entries.length,
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results,
    };
  }

  // Lire tous les événements du calendrier Google
  async listGoogleCalendarEvents(
    accessToken: string,
    refreshToken?: string,
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 50,
  ) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin ? timeMin.toISOString() : new Date().toISOString(),
        timeMax: timeMax ? timeMax.toISOString() : undefined,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      return {
        success: true,
        count: events.length,
        events: events.map(event => ({
          id: event.id,
          summary: event.summary,
          description: event.description,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
          htmlLink: event.htmlLink,
          status: event.status,
          created: event.created,
          updated: event.updated,
        })),
      };
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw new BadRequestException('Failed to fetch Google Calendar events');
    }
  }

  // Lire un événement spécifique
  async getGoogleCalendarEvent(
    eventId: string,
    accessToken: string,
    refreshToken?: string,
  ) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });

      const event = response.data;
      
      return {
        success: true,
        event: {
          id: event.id,
          summary: event.summary,
          description: event.description,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
          htmlLink: event.htmlLink,
          status: event.status,
          created: event.created,
          updated: event.updated,
          attendees: event.attendees,
          reminders: event.reminders,
        },
      };
    } catch (error) {
      console.error('Error fetching Google Calendar event:', error);
      throw new BadRequestException('Failed to fetch Google Calendar event');
    }
  }

  // Créer un événement de test simple (pour démo)
  async createTestEvent(
    accessToken: string,
    refreshToken?: string,
    title?: string,
    date?: string,
    time?: string,
  ) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Créer la date/heure de l'événement
    const eventDate = date ? new Date(date) : new Date();
    eventDate.setDate(eventDate.getDate() + 1); // Demain par défaut

    const [hours, minutes] = (time || '14:00').split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes), 0);

    const endDateTime = new Date(eventDate);
    endDateTime.setHours(eventDate.getHours() + 1); // Durée de 1 heure

    const event = {
      summary: title || '🎉 Test IdeaSpark - Google Calendar',
      description: 'Événement de test créé depuis IdeaSpark Backend\n\nCeci est un test de l\'intégration Google Calendar.',
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 },
        ],
      },
      colorId: '9', // Bleu
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      return {
        success: true,
        message: 'Événement de test créé avec succès !',
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        eventDetails: {
          title: event.summary,
          start: event.start.dateTime,
          end: event.end.dateTime,
        },
      };
    } catch (error) {
      console.error('Error creating test event:', error);
      throw new BadRequestException('Failed to create test event in Google Calendar');
    }
  }
}
