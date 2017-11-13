import winston from 'winston';
import config from './config';

const logger = new (winston.Logger)({
  level: 'debug',
  transports: [
    new (winston.transports.Console)({
      json: true, //config.NODE_ENV === 'production',
      colorize: true,
      stringify: (obj) => JSON.stringify(obj),
    })
  ]
});

export default { logger };
