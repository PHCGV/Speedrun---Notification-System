/**
 * Logger simples para eventos do sistema
 */
class Logger {
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      level,
      message,
      ...data
    };
    
    if (level === 'error') {
      console.error('[ERROR]', timestamp, message, data);
    } else if (level === 'warn') {
      console.warn('[WARN]', timestamp, message, data);
    } else {
      console.log('[INFO]', timestamp, message, data);
    }
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  error(message, data = {}) {
    this.log('error', message, data);
  }
}

module.exports = new Logger();
