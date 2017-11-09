import opbeat from 'opbeat/start';
import express from 'express';
import morganLogger from 'morgan';
import bodyParser from 'body-parser';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import path from 'path';
import favicon from 'serve-favicon';
import httpStatus from 'http-status';
import expressWinston from 'express-winston';
import expressValidation from 'express-validation';
import helmet from 'helmet';
import { logger, errlogger } from './logger';
import routes from '../routes';
import config from './config';
import { APIError } from '../helpers/errors';


const app = express();

if (config.NODE_ENV === 'development') {
  app.use(morganLogger('dev'));
} else if (config.NODE_ENV !== 'test') {
  app.use(morganLogger('combined'));
}

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet({ noCache: true }));

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// serve favicon
app.use(favicon(path.join(__dirname, '..', 'public', 'favicon.ico')));

// enable detailed API request logging in dev env
if (config.NODE_ENV === 'development') {
  expressWinston.requestWhitelist.push('body');
  expressWinston.responseWhitelist.push('body');
  app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true, // optional: log meta data about request (defaults to true)
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    colorStatus: true // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
  }));
}

// mount all routes on / path
app.use('/', routes);

// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
  if (err instanceof expressValidation.ValidationError) {
    // validation error contains errors which is an array of error each containing message[]
    const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
    const error = new APIError(unifiedErrorMessage, err.status, true);
    return next(error);
  } else if (!(err instanceof APIError)) {
    const apiError = new APIError(err.message, err.status, err.isPublic);
    return next(apiError);
  }
  return next(err);
});

// log errors to opbeat in production env
if (config.NODE_ENV === 'production') {
  app.use(opbeat.middleware.express());
}

// log errors in winston transports in dev env
if (config.NODE_ENV === 'development') {
  app.use(expressWinston.errorLogger({ winstonInstance: errlogger }));
}

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new APIError('API not found', httpStatus.NOT_FOUND);
  return next(err);
});

// error handler, send stacktrace in response only during development
app.use((err, req, res, next) => // eslint-disable-line no-unused-vars
  res.status(err.status).json(
    Object.assign(
      { message: err.isPublic ? err.message : httpStatus[err.status] },
      // Add stack in dev
      config.NODE_ENV === 'development' ? { stack: err.stack } : {}
    )
  )
);
export default app;
