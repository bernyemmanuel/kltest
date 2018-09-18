import winston from 'winston';
import winstonRotator from 'winston-daily-rotate-file';
import expressWinston from 'express-winston';

const createLogger = new winston.Logger({
    transports: []
});

const successLogger = createLogger;
successLogger.add(winstonRotator, {
    name: 'access-file',
    level: 'info',
    filename: path.join(rootLocation, 'logs/access.log'),
    json: false,
    datePattern: 'yyyy-MM-dd-',
    prepend: true
});

const errorLogger = createLogger;
errorLogger.add(winstonRotator, {
    name: 'error-file',
    level: 'error',
    filename: path.join(rootLocation, 'logs/error.log'),
    json: false,
    datePattern: 'yyyy-MM-dd-',
    prepend: true
});

const expressLogger = expressWinston.logger({
    winstonInstance: createLogger
});

module.exports = {
    successlog: successLogger,
    errorlog: errorLogger,
    expressLogger
};
