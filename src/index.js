import app from './config/express';
import { logger } from './config/logger';
import config from './config/config';

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  // listen on port config.PORT
  app.listen(config.PORT, () => {
    logger.info(`server started on port ${config.PORT} (${config.NODE_ENV})`);
  });
}

export default app;
