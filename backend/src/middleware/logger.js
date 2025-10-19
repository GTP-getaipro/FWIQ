/**
 * Logger Middleware
 * Simple logger for backend services
 */

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
    }
  }

  error(message, error = {}) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }

  shouldLog(level) {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }
}

export const logger = new Logger();
export default logger;
