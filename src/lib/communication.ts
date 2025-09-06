/**
 * Communication service for sending notifications, emails and SMS
 */
import { logger } from './logger';

export interface NotificationPayload {
  type: 'email' | 'sms' | 'notification';
  recipient: {
    name: string;
    email?: string;
    phone?: string;
  };
  subject: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Send a reminder notification via the specified method
 */
export async function sendReminderNotification(
  type: 'email' | 'sms' | 'notification',
  loanData: {
    id: string;
    equipmentName: string;
    borrowerName: string;
    borrowerEmail?: string;
    borrowerPhone?: string;
    overdueDays: number;
  },
  message: string
): Promise<void> {
  const payload: NotificationPayload = {
    type,
    recipient: {
      name: loanData.borrowerName,
      email: loanData.borrowerEmail,
      phone: loanData.borrowerPhone,
    },
    subject: `Lembrete: Devolução de equipamento em atraso`,
    message,
    metadata: {
      loanId: loanData.id,
      equipmentName: loanData.equipmentName,
      overdueDays: loanData.overdueDays,
    }
  };

  logger.info('Sending reminder notification', {
    module: 'communication',
    action: 'send_reminder',
    data: {
      type,
      recipient: loanData.borrowerName,
      equipmentName: loanData.equipmentName
    }
  });

  try {
    switch (type) {
      case 'email':
        await sendEmailReminder(payload);
        break;
      case 'sms':
        await sendSMSReminder(payload);
        break;
      case 'notification':
        await sendInternalNotification(payload);
        break;
    }
    
    logger.info('Reminder notification sent successfully', {
      module: 'communication',
      action: 'send_reminder_success',
      data: {
        type,
        recipient: loanData.borrowerName
      }
    });
  } catch (error) {
    logger.error('Failed to send reminder notification', {
      module: 'communication',
      action: 'send_reminder_error',
      error,
      data: {
        type,
        recipient: loanData.borrowerName
      }
    });
    throw error;
  }
}

/**
 * Send email reminder (placeholder for future integration)
 */
async function sendEmailReminder(payload: NotificationPayload): Promise<void> {
  // TODO: Integrate with email service (SendGrid, Amazon SES, etc.)
  logger.debug('Email reminder would be sent', {
    module: 'communication',
    action: 'send_email_reminder',
    data: {
      to: payload.recipient.email,
      subject: payload.subject,
      messageLength: payload.message.length
    }
  });
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
}

/**
 * Send SMS reminder (placeholder for future integration)
 */
async function sendSMSReminder(payload: NotificationPayload): Promise<void> {
  // TODO: Integrate with SMS service (Twilio, Amazon SNS, etc.)
  logger.debug('SMS reminder would be sent', {
    module: 'communication',
    action: 'send_sms_reminder',
    data: {
      to: payload.recipient.phone,
      messageLength: payload.message.length
    }
  });
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 600));
}

/**
 * Send internal notification
 */
async function sendInternalNotification(payload: NotificationPayload): Promise<void> {
  // This could integrate with the notification system
  logger.info('Internal notification created', {
    module: 'communication',
    action: 'send_internal_notification',
    data: {
      recipient: payload.recipient.name,
      subject: payload.subject,
      messageLength: payload.message.length
    }
  });
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * Validate contact information for different communication types
 */
export function validateContactInfo(
  type: 'email' | 'sms' | 'notification',
  contact: { email?: string; phone?: string }
): boolean {
  switch (type) {
    case 'email':
      return !!(contact.email && contact.email.includes('@'));
    case 'sms':
      return !!(contact.phone && contact.phone.length >= 10);
    case 'notification':
      return true; // Internal notifications don't require external contact
    default:
      return false;
  }
}

/**
 * Format phone number for SMS sending
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits and format for Brazilian numbers
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (digits.length === 11 && digits.startsWith('9')) {
    return `+55${digits}`;
  } else if (digits.length === 10) {
    return `+559${digits}`;
  }
  
  return `+55${digits}`;
}