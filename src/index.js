import config from './config/config';
import app from './config/express';

const debug = require('debug')('s3-zipstream-server:index');

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  // listen on port config.PORT
  app.listen(config.PORT, () => {
    console.info(`server started on port ${config.PORT} (${config.NODE_ENV})`); // eslint-disable-line no-console
  });
}

export default app;
