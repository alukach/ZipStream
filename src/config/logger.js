import winston from 'winston';
import config from './config';


const logger = new (winston.Logger)({
  level: 'debug',
  transports: [
    new (winston.transports.Console)({
      json: config.NODE_ENV === 'production',
      stringify: config.NODE_ENV === 'production',
      colorize: config.NODE_ENV !== 'production',
      timestamp: config.NODE_ENV !== 'production',
    })
  ]
});
const errlogger = new (winston.Logger)({
  level: 'error',
  transports: [
    new (winston.transports.Console)({
      json: true,
      stringify: config.NODE_ENV === 'production',
    })
  ]
});

export default { logger, errlogger };
