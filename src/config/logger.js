import winston from 'winston';
import config from './config';

const logger = new (winston.Logger)({
  level: 'debug',
  transports: [
    new (winston.transports.Console)({
      json: config.NODE_ENV === 'production',
      colorize: true,
    })
  ]
});

export default { logger };
