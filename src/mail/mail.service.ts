import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ?? 587,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }

  async sendVerificationCode(toEmail: string, code: string): Promise<void> {
    const subject = 'IdeaSpark - Code de vérification';
    const html = `
      <p>Bonjour,</p>
      <p>Votre code de vérification IdeaSpark est : <strong>${code}</strong></p>
      <p>Ce code expire dans 15 minutes.</p>
      <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
    `;
    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'IdeaSpark <noreply@ideaspark.com>',
        to: toEmail,
        subject,
        html,
      });
    } else {
      // Development: log code to console
      console.log(`[Mail] Verification code for ${toEmail}: ${code}`);
    }
  }

  async sendDeleteAccountCode(toEmail: string, code: string): Promise<void> {
    const subject = 'IdeaSpark - Confirmer la suppression du compte';
    const html = `
      <p>Bonjour,</p>
      <p>Vous avez demandé la suppression de votre compte IdeaSpark.</p>
      <p>Votre code de confirmation est : <strong>${code}</strong></p>
      <p>Ce code expire dans 15 minutes. Si vous n'avez pas demandé cette suppression, ignorez cet email et changez votre mot de passe.</p>
    `;
    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'IdeaSpark <noreply@ideaspark.com>',
        to: toEmail,
        subject,
        html,
      });
    } else {
      console.log(`[Mail] Delete account code for ${toEmail}: ${code}`);
    }
  }

  async sendPasswordResetCode(toEmail: string, code: string): Promise<void> {
    const subject = 'IdeaSpark - Réinitialisation du mot de passe';
    const html = `
      <p>Bonjour,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe IdeaSpark.</p>
      <p>Votre code est : <strong>${code}</strong></p>
      <p>Ce code expire dans 15 minutes. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    `;
    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'IdeaSpark <noreply@ideaspark.com>',
        to: toEmail,
        subject,
        html,
      });
    } else {
      console.log(`[Mail] Password reset code for ${toEmail}: ${code}`);
    }
  }
}
