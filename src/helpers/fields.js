import uuidv4 from 'uuid/v4';

import config from '../config/config';


function getExpirationDate() {
  const lifetime = config.DATA_LIFETIME * 60;
  const expirationDate = new Date();
  expirationDate.setSeconds(expirationDate.getSeconds() + lifetime);
  return expirationDate;
}

function getUUID() {
  return uuidv4();
}

export default { getExpirationDate, getUUID };
