import config from '../../config/config';

const DbInterface = require(`./${config.DB_INTERFACE}`);

export default new DbInterface(config);
