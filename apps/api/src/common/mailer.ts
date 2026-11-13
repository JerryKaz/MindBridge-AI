import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export interface Mailer {
  send(to: string, subject: string, text: string): Promise<void>;
}

class SmtpMailer implements Mailer {
  private transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });

  async send(to: string, subject: string, text: string): Promise<void> {
    await this.transport.sendMail({ from: env.MAIL_FROM, to, subject, text });
  }
}

/** Development only (production refuses to boot without SMTP_HOST). */
class DevLogMailer implements Mailer {
  async send(to: string, subject: string, text: string): Promise<void> {
    if (env.NODE_ENV === 'test') return;
    logger.warn({ to, subject }, `[dev mailer] SMTP not configured. Email body:\n${text}`);
  }
}

export const mailer: Mailer = env.SMTP_HOST ? new SmtpMailer() : new DevLogMailer();
