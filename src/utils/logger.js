/**
 * Production-Safe Logger
 * 
 * Only logs in development mode to prevent exposing system internals to competitors
 */

const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;
const isProduction = import.meta.env.MODE === 'production' || import.meta.env.PROD;

class Logger {
  constructor() {
    this.isDev = isDevelopment;
    this.isProd = isProduction;
  }

  /**
   * Development-only info logs (hidden in production)
   */
  info(...args) {
    if (this.isDev) {
      console.log(...args);
    }
  }

  /**
   * Development-only debug logs (hidden in production)
   */
  debug(...args) {
    if (this.isDev) {
      console.log(...args);
    }
  }

  /**
   * Warning logs (shown in both dev and production)
   */
  warn(...args) {
    console.warn(...args);
  }

  /**
   * Error logs (always shown - needed for debugging critical issues)
   */
  error(...args) {
    console.error(...args);
  }

  /**
   * Success logs (development only)
   */
  success(...args) {
    if (this.isDev) {
      console.log(...args);
    }
  }

  /**
   * Generic log (development only)
   */
  log(...args) {
    if (this.isDev) {
      console.log(...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;

