import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GoogleCalendarService } from './google-calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Google Calendar')
@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @Get('auth-url')
  @ApiOperation({
    summary: 'Obtenir l\'URL d\'autorisation Google Calendar',
    description: 'Retourne l\'URL pour connecter le compte Google de l\'utilisateur (endpoint public)',
  })
  @ApiResponse({
    status: 200,
    description: 'URL d\'autorisation générée',
    schema: {
      example: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?...',
      },
    },
  })
  getAuthUrl() {
    const authUrl = this.googleCalendarService.getAuthUrl();
    return { authUrl };
  }

  @Get('callback')
  @ApiOperation({
    summary: 'Callback OAuth Google',
    description: 'Endpoint appelé par Google après autorisation',
  })
  async handleCallback(@Query('code') code: string) {
    if (!code) {
      return { error: 'No authorization code provided' };
    }

    const tokens = await this.googleCalendarService.getTokensFromCode(code);
    
    // Dans une vraie application, vous devriez sauvegarder ces tokens
    // dans la base de données associés à l'utilisateur
    return {
      success: true,
      message: 'Successfully connected to Google Calendar',
      // Ne pas exposer les tokens directement en production
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  }

  @Post('sync-entry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Synchroniser une entrée de calendrier avec Google Calendar',
    description: 'Ajoute une entrée de calendrier à Google Calendar',
  })
  @ApiResponse({
    status: 200,
    description: 'Entrée synchronisée avec succès',
  })
  async syncEntry(
    @Body() body: { calendarEntryId: string; accessToken: string; refreshToken?: string },
  ) {
    return this.googleCalendarService.syncToGoogleCalendar(
      body.calendarEntryId,
      body.accessToken,
      body.refreshToken,
    );
  }

  @Post('sync-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Synchroniser tout un plan avec Google Calendar',
    description: 'Ajoute toutes les entrées d\'un plan à Google Calendar',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan synchronisé avec succès',
  })
  async syncPlan(
    @Body() body: { planId: string; accessToken: string; refreshToken?: string },
    @Request() req: any,
  ) {
    return this.googleCalendarService.syncPlanToGoogleCalendar(
      body.planId,
      req.user._id,
      body.accessToken,
      body.refreshToken,
    );
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Lire tous les événements du Google Calendar',
    description: 'Récupère la liste des événements du calendrier Google de l\'utilisateur',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des événements récupérée avec succès',
    schema: {
      example: {
        success: true,
        count: 5,
        events: [
          {
            id: 'event123',
            summary: 'Réunion importante',
            description: 'Discussion sur le projet',
            start: '2024-01-15T10:00:00Z',
            end: '2024-01-15T11:00:00Z',
            htmlLink: 'https://calendar.google.com/...',
          },
        ],
      },
    },
  })
  async listEvents(
    @Body() body: { 
      accessToken: string; 
      refreshToken?: string;
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
    },
  ) {
    const timeMin = body.timeMin ? new Date(body.timeMin) : undefined;
    const timeMax = body.timeMax ? new Date(body.timeMax) : undefined;
    
    return this.googleCalendarService.listGoogleCalendarEvents(
      body.accessToken,
      body.refreshToken,
      timeMin,
      timeMax,
      body.maxResults,
    );
  }

  @Get('events/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Lire un événement spécifique du Google Calendar',
    description: 'Récupère les détails d\'un événement spécifique',
  })
  @ApiResponse({
    status: 200,
    description: 'Événement récupéré avec succès',
  })
  async getEvent(
    @Query('eventId') eventId: string,
    @Body() body: { accessToken: string; refreshToken?: string },
  ) {
    return this.googleCalendarService.getGoogleCalendarEvent(
      eventId,
      body.accessToken,
      body.refreshToken,
    );
  }

  @Post('create-test-event')
  @ApiOperation({
    summary: 'Créer un événement de test (DEMO)',
    description: 'Crée un événement de test dans Google Calendar sans authentification JWT',
  })
  @ApiResponse({
    status: 201,
    description: 'Événement de test créé avec succès',
  })
  async createTestEvent(
    @Body() body: { 
      accessToken: string; 
      refreshToken?: string;
      title?: string;
      date?: string;
      time?: string;
    },
  ) {
    return this.googleCalendarService.createTestEvent(
      body.accessToken,
      body.refreshToken,
      body.title,
      body.date,
      body.time,
    );
  }
}
