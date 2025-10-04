import { logger } from '../utils/logger';

type TwilioClient = {
  messages: {
    create: (opts: { from: string; to: string; body: string }) => Promise<{ sid?: string }>;
  };
};

let twilioClient: TwilioClient | null = null;

function getTwilioClient(): TwilioClient | null {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env as Record<string, string | undefined>;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    logger.warn('Twilio credentials are not set. WhatsApp sending is disabled.');
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio');
    return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) as TwilioClient;
  } catch (error) {
    logger.error('Failed to initialize Twilio client', error);
    return null;
  }
}

export async function sendWhatsAppMessage(toPhoneE164: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const { TWILIO_WHATSAPP_FROM } = process.env as Record<string, string | undefined>;

  if (!TWILIO_WHATSAPP_FROM) {
    const msg = 'TWILIO_WHATSAPP_FROM is not set. Expected format: whatsapp:+14155238886';
    logger.warn(msg);
    return { success: false, error: msg };
  }

  if (!twilioClient) {
    twilioClient = getTwilioClient();
  }

  if (!twilioClient) {
    return { success: false, error: 'Twilio client not available' };
  }

  try {
    const resp = await twilioClient.messages.create({ from: TWILIO_WHATSAPP_FROM, to: `whatsapp:${toPhoneE164}`, body: message });
    return { success: true, sid: resp?.sid };
  } catch (error: any) {
    logger.error('Error sending WhatsApp message', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

export function formatAlertForWhatsApp(alert: {
  title: string;
  message: string;
  category: string;
  type: string;
  priority: string;
  trainId?: string;
  actionUrl?: string;
  timestamp?: Date;
}): string {
  const ts = alert.timestamp ? new Date(alert.timestamp) : new Date();
  const parts = [
    `` // placeholder to ensure array is not empty
  ];
  parts.length = 0; // reset
  parts.push(`[${alert.priority.toUpperCase()}] ${alert.title}`);
  parts.push(alert.message);
  parts.push(`Category: ${alert.category} | Type: ${alert.type}${alert.trainId ? ` | Train: ${alert.trainId}` : ''}`);
  parts.push(`Time: ${ts.toLocaleString()}`);
  if (alert.actionUrl) parts.push(`Action: ${alert.actionUrl}`);
  return parts.join('\n');
}


