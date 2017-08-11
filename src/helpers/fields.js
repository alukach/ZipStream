import uuidv4 from 'uuid/v4';

import config from '../config/config';


function getExpirationDate() {
  const lifetime = config.DATA_LIFETIME * 60
  let expirationDate = new Date();
  expirationDate.setSeconds(expirationDate.getSeconds() + lifetime);
  return Math.floor(expirationDate.getTime() / 1000)
}

function getUUID() {
  return uuidv4()
}

export default { getExpirationDate, getUUID }
