import { Controller, Get, Post, Body, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { GoogleCalendarService } from './google-calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Google Calendar')
@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @Get('auth-url')
  @ApiOperation({ summary: "Obtenir l'URL d'autorisation Google Calendar" })
  @ApiResponse({ status: 200, description: "URL d'autorisation générée" })
  getAuthUrl() {
    const authUrl = this.googleCalendarService.getAuthUrl();
    return { authUrl };
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error || !code) {
      const deepLink = `ideaspark://google-calendar/callback?error=${encodeURIComponent(error || 'no_code')}`;
      return res.send(this.buildHtmlPage('error', deepLink, error || 'no_code'));
    }

    try {
      const tokens = await this.googleCalendarService.getTokensFromCode(code);
      const accessToken = encodeURIComponent(tokens.access_token || '');
      const refreshToken = encodeURIComponent(tokens.refresh_token || '');
      const deepLink = `ideaspark://google-calendar/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
      return res.send(this.buildHtmlPage('success', deepLink));
    } catch (err: any) {
      return res.send(this.buildHtmlPage('error', '', err.message));
    }
  }

  private buildHtmlPage(type: 'success' | 'error', deepLink: string, errorMsg?: string): string {
    if (type === 'success') {
      return `<!DOCTYPE html>
<html>
  <head><title>IdeaSpark - Connexion réussie</title></head>
  <body style="font-family: Arial; text-align: center; padding: 50px; background: #0a0a1a; color: white;">
    <h2>✅ Connexion Google Calendar réussie !</h2>
    <p>Retournez dans l'application IdeaSpark.</p>
    <script>
      window.location.href = '${deepLink}';
      setTimeout(() => {
        document.body.innerHTML += '<p>Si l\\'application ne s\\'ouvre pas, <a href="${deepLink}" style="color: #4285F4;">cliquez ici</a></p>';
      }, 1000);
    </script>
  </body>
</html>`;
    }
    return `<!DOCTYPE html>
<html>
  <body style="background:#0a0a1a;color:white;text-align:center;padding:50px">
    <h2>❌ Erreur de connexion</h2>
    <p>${errorMsg || 'Une erreur est survenue'}</p>
  </body>
</html>`;
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Rafraîchir l\'access token Google' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.googleCalendarService.refreshAccessToken(body.refreshToken);
  }

  @Post('sync-entry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Synchroniser une entrée de calendrier avec Google Calendar' })
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
  @ApiOperation({ summary: 'Synchroniser tout un plan avec Google Calendar' })
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
  @ApiOperation({ summary: 'Lire tous les événements du Google Calendar' })
  async listEvents(
    @Body() body: {
      accessToken: string;
      refreshToken?: string;
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
    },
  ) {
    return this.googleCalendarService.listGoogleCalendarEvents(
      body.accessToken,
      body.refreshToken,
      body.timeMin ? new Date(body.timeMin) : undefined,
      body.timeMax ? new Date(body.timeMax) : undefined,
      body.maxResults,
    );
  }

  @Get('events/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Lire un événement spécifique du Google Calendar' })
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
  @ApiOperation({ summary: 'Créer un événement de test (DEMO)' })
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
