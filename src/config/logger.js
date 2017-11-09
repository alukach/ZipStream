import winston from 'winston';

const logger = new (winston.Logger)({
  level: 'debug',
  transports: [
    new (winston.transports.Console)({
      json: false,
      colorize: true,
    })
  ]
});
const errlogger = new (winston.Logger)({
  level: 'error',
  transports: [
    new (winston.transports.Console)({
      json: true,
      colorize: true,
      dumpExceptions: false,
      showStack: false
    })
  ]
});

export default { logger, errlogger };
