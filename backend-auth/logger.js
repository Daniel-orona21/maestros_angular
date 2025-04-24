const winston = require('winston');
const { format, transports } = winston;
const path = require('path');

// Definir el formato para los logs
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, meta }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${meta ? JSON.stringify(meta) : ''}`;
  })
);

// Crear el logger
const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  defaultMeta: { service: 'maestros-api' },
  transports: [
    // Escribir logs de error en el archivo error.log
    new transports.File({ 
      filename: path.join(__dirname, 'logs/error.log'), 
      level: 'error' 
    }),
    // Escribir todos los logs en el archivo combined.log
    new transports.File({ 
      filename: path.join(__dirname, 'logs/combined.log') 
    }),
    // Escribir logs de acceso en access.log
    new transports.File({
      filename: path.join(__dirname, 'logs/access.log'),
      level: 'info',
      format: logFormat
    }),
    // Escribir logs de operaciones CRUD en operations.log
    new transports.File({
      filename: path.join(__dirname, 'logs/operations.log'),
      level: 'info',
      format: logFormat
    }),
    // Escribir logs de seguridad en security.log
    new transports.File({
      filename: path.join(__dirname, 'logs/security.log'),
      level: 'warn',
      format: logFormat
    })
  ],
});

// Si no estamos en producción, también registrar en la consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      logFormat
    ),
  }));
}

// Categorías de logs
const logTypes = {
  ACCESS: 'access',
  OPERATION: 'operation',
  ERROR: 'error',
  SECURITY: 'security'
};

// Crear el directorio de logs si no existe
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  fs.mkdirSync(path.join(__dirname, 'logs'));
}

// Función para registrar eventos de acceso
function logAccess(userId, action, details = {}) {
  logger.info(`User ${userId} ${action}`, { 
    type: logTypes.ACCESS, 
    userId, 
    action,
    details
  });
}

// Función para registrar operaciones CRUD
function logOperation(userId, operation, resource, details = {}) {
  logger.info(`User ${userId} ${operation} ${resource}`, { 
    type: logTypes.OPERATION, 
    userId, 
    operation, 
    resource,
    details
  });
}

// Función para registrar errores
function logError(error, userId = null, details = {}) {
  logger.error(`${error.message || error}`, { 
    type: logTypes.ERROR, 
    userId,
    stack: error.stack,
    details
  });
}

// Función para registrar eventos de seguridad
function logSecurity(userId, action, details = {}) {
  logger.warn(`Security event: User ${userId} ${action}`, { 
    type: logTypes.SECURITY, 
    userId, 
    action,
    details
  });
}

module.exports = {
  logger,
  logTypes,
  logAccess,
  logOperation,
  logError,
  logSecurity
}; 