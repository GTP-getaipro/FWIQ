export class BusinessHoursManager {
  constructor(hours = null) {
    this.hours = hours || this.getDefaultHours();
  }

  isBusinessHours() {
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() * 100 + now.getMinutes();

    const todayHours = this.hours[day];
    if (!todayHours || !todayHours.enabled) {
      return false;
    }

    return time >= todayHours.start && time <= todayHours.end;
  }

  getNextBusinessDay() {
    const now = new Date();
    let nextDay = new Date(now);
    
    do {
      nextDay.setDate(nextDay.getDate() + 1);
    } while (!this.hours[nextDay.getDay()]?.enabled);

    return nextDay;
  }

  getResponseDelay() {
    if (this.isBusinessHours()) {
      return 0; // Immediate response
    } else {
      const nextDay = this.getNextBusinessDay();
      return nextDay.getTime() - Date.now();
    }
  }

  getDefaultHours() {
    return {
      0: { enabled: false }, // Sunday
      1: { enabled: true, start: 900, end: 1700 }, // Monday
      2: { enabled: true, start: 900, end: 1700 }, // Tuesday
      3: { enabled: true, start: 900, end: 1700 }, // Wednesday
      4: { enabled: true, start: 900, end: 1700 }, // Thursday
      5: { enabled: true, start: 900, end: 1700 }, // Friday
      6: { enabled: false } // Saturday
    };
  }

  // Helper method to format time from minutes since midnight
  formatTime(timeInMinutes) {
    const hours = Math.floor(timeInMinutes / 100);
    const minutes = timeInMinutes % 100;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Helper method to get business hours status message
  getStatusMessage() {
    if (this.isBusinessHours()) {
      return "We're currently open for business";
    } else {
      const nextDay = this.getNextBusinessDay();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `We're currently closed. Next business day: ${days[nextDay.getDay()]}`;
    }
  }

  // Method to update business hours
  updateHours(newHours) {
    this.hours = { ...this.getDefaultHours(), ...newHours };
  }

  // Method to get current hours configuration
  getHours() {
    return this.hours;
  }
}
