import config from '../../config/config';
import errors from '../../helpers/errors';

const DbInterface = require(`./${config.DB_INTERFACE}`);

export default new DbInterface(config, errors);
