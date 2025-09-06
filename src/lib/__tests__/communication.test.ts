import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendReminderNotification, validateContactInfo, formatPhoneNumber } from '../communication';

// Mock the logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }
}));

describe('Communication Service', () => {
  const mockLoanData = {
    id: 'loan-123',
    equipmentName: 'Camera Canon 5D',
    borrowerName: 'João Silva',
    borrowerEmail: 'joao@example.com',
    borrowerPhone: '11999888777',
    overdueDays: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendReminderNotification', () => {
    it('should send email reminder successfully', async () => {
      await expect(
        sendReminderNotification('email', mockLoanData, 'Test message')
      ).resolves.not.toThrow();
    });

    it('should send SMS reminder successfully', async () => {
      await expect(
        sendReminderNotification('sms', mockLoanData, 'Test SMS')
      ).resolves.not.toThrow();
    });

    it('should send internal notification successfully', async () => {
      await expect(
        sendReminderNotification('notification', mockLoanData, 'Internal note')
      ).resolves.not.toThrow();
    });
  });

  describe('validateContactInfo', () => {
    it('should validate email contact', () => {
      expect(validateContactInfo('email', { email: 'test@example.com' })).toBe(true);
      expect(validateContactInfo('email', { email: 'invalid-email' })).toBe(false);
      expect(validateContactInfo('email', {})).toBe(false);
    });

    it('should validate SMS contact', () => {
      expect(validateContactInfo('sms', { phone: '11999888777' })).toBe(true);
      expect(validateContactInfo('sms', { phone: '123' })).toBe(false);
      expect(validateContactInfo('sms', {})).toBe(false);
    });

    it('should always validate notification contact', () => {
      expect(validateContactInfo('notification', {})).toBe(true);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Brazilian mobile numbers correctly', () => {
      expect(formatPhoneNumber('11999888777')).toBe('+5511999888777');
      expect(formatPhoneNumber('(11) 99988-8777')).toBe('+5511999888777');
    });

    it('should handle landline numbers', () => {
      expect(formatPhoneNumber('1133334444')).toBe('+55911333344444');
    });

    it('should handle numbers with country code', () => {
      expect(formatPhoneNumber('+5511999888777')).toBe('+555511999888777');
    });
  });
});