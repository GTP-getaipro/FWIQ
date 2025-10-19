import { BusinessHoursManager } from '../businessHours';

describe('BusinessHoursManager', () => {
  let manager;

  beforeEach(() => {
    manager = new BusinessHoursManager();
  });

  describe('Default Hours', () => {
    test('should have correct default business hours', () => {
      const hours = manager.getHours();
      
      expect(hours[0].enabled).toBe(false); // Sunday
      expect(hours[1].enabled).toBe(true);  // Monday
      expect(hours[1].start).toBe(900);     // 9:00 AM
      expect(hours[1].end).toBe(1700);      // 5:00 PM
      expect(hours[6].enabled).toBe(false); // Saturday
    });
  });

  describe('Business Hours Check', () => {
    test('should return false for weekend by default', () => {
      // Mock a Sunday
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2024-01-07T10:00:00Z')); // Sunday
      global.Date.now = originalDate.now;
      
      expect(manager.isBusinessHours()).toBe(false);
      
      global.Date = originalDate;
    });

    test('should return true for weekday during business hours', () => {
      // Mock a Monday at 10 AM
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2024-01-08T10:00:00Z')); // Monday
      global.Date.now = originalDate.now;
      
      expect(manager.isBusinessHours()).toBe(true);
      
      global.Date = originalDate;
    });

    test('should return false for weekday outside business hours', () => {
      // Mock a Monday at 8 PM
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2024-01-08T20:00:00Z')); // Monday evening
      global.Date.now = originalDate.now;
      
      expect(manager.isBusinessHours()).toBe(false);
      
      global.Date = originalDate;
    });
  });

  describe('Next Business Day', () => {
    test('should return next Monday for weekend', () => {
      // Mock a Saturday
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2024-01-06T10:00:00Z')); // Saturday
      global.Date.now = originalDate.now;
      
      const nextDay = manager.getNextBusinessDay();
      expect(nextDay.getDay()).toBe(1); // Monday
      
      global.Date = originalDate;
    });
  });

  describe('Response Delay', () => {
    test('should return 0 during business hours', () => {
      // Mock a Monday at 10 AM
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2024-01-08T10:00:00Z')); // Monday
      global.Date.now = originalDate.now;
      
      expect(manager.getResponseDelay()).toBe(0);
      
      global.Date = originalDate;
    });

    test('should return positive delay outside business hours', () => {
      // Mock a Saturday
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2024-01-06T10:00:00Z')); // Saturday
      global.Date.now = originalDate.now;
      
      const delay = manager.getResponseDelay();
      expect(delay).toBeGreaterThan(0);
      
      global.Date = originalDate;
    });
  });

  describe('Time Formatting', () => {
    test('should format time correctly', () => {
      expect(manager.formatTime(900)).toBe('09:00');
      expect(manager.formatTime(1700)).toBe('17:00');
      expect(manager.formatTime(1230)).toBe('12:30');
    });
  });

  describe('Status Message', () => {
    test('should return open message during business hours', () => {
      // Mock a Monday at 10 AM
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2024-01-08T10:00:00Z')); // Monday
      global.Date.now = originalDate.now;
      
      const message = manager.getStatusMessage();
      expect(message).toContain("We're currently open");
      
      global.Date = originalDate;
    });

    test('should return closed message outside business hours', () => {
      // Mock a Saturday
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2024-01-06T10:00:00Z')); // Saturday
      global.Date.now = originalDate.now;
      
      const message = manager.getStatusMessage();
      expect(message).toContain("We're currently closed");
      
      global.Date = originalDate;
    });
  });

  describe('Hours Update', () => {
    test('should update hours correctly', () => {
      const newHours = {
        0: { enabled: true, start: 1000, end: 1600 }, // Sunday
        1: { enabled: false } // Monday
      };
      
      manager.updateHours(newHours);
      const hours = manager.getHours();
      
      expect(hours[0].enabled).toBe(true);
      expect(hours[0].start).toBe(1000);
      expect(hours[1].enabled).toBe(false);
    });
  });
});
