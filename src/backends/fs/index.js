import winston from 'winston';

import config from '../../config/config';

// Import required fs interfaces
const FS_INTERFACES = {};
const _interfaces = config.FS_INTERFACES.split(',').map(v => v.trim());
for (const _interface of _interfaces) {
  FS_INTERFACES[_interface] = require(`./${_interface}`);  // eslint-disable-line global-require
  winston.debug(`Setup '${_interface}' interface`);

  // Ensure non-ssl protocols will be handled by https interface
  if (_interface === 'https') {
    FS_INTERFACES.http = FS_INTERFACES.https;
    winston.debug("Setup 'http' interface");
  }
}
export default FS_INTERFACES;
