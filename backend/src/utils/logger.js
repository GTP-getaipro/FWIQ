import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      try {
        log += `\n${JSON.stringify(meta, null, 2)}`;
      } catch (stringifyError) {
        // Handle circular references in meta
        log += `\n[Circular reference in log data - showing keys only: ${Object.keys(meta).join(', ')}]`;
      }
    }
    
    return log;
  })
);

// Define log format for files (without colors)
const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat
  })
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '../../logs');
  
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileLogFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileLogFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: fileLogFormat,
  transports,
  exitOnError: false
});

// Add request logging helper
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  };
  
  if (res.statusCode >= 400) {
    logger.error('HTTP Request Error', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

// Add database logging helper
logger.logDatabase = (operation, table, duration, error = null) => {
  const logData = {
    operation,
    table,
    duration: `${duration}ms`
  };
  
  if (error) {
    logger.error('Database Error', { ...logData, error: error.message });
  } else {
    logger.debug('Database Operation', logData);
  }
};

// Add API logging helper
logger.logAPI = (service, endpoint, duration, error = null) => {
  const logData = {
    service,
    endpoint,
    duration: `${duration}ms`
  };
  
  if (error) {
    logger.error('API Error', { ...logData, error: error.message });
  } else {
    logger.debug('API Call', logData);
  }
};

// Add security logging helper
logger.logSecurity = (event, details = {}) => {
  logger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Add performance logging helper
logger.logPerformance = (operation, duration, metadata = {}) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    ...metadata
  };
  
  if (duration > 1000) {
    logger.warn('Slow Operation', logData);
  } else {
    logger.debug('Performance', logData);
  }
};

// Handle uncaught exceptions and unhandled rejections
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/exceptions.log'),
      format: fileLogFormat
    })
  );
  
  logger.rejections.handle(
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/rejections.log'),
      format: fileLogFormat
    })
  );
}

export default logger;
