import config from '../../config/config';
import errors from '../../helpers/errors';

const cls = require('./' + config.DB_INTERFACE);

export default new cls(config, errors)