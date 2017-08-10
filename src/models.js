import Joi from 'joi';
import uuidv4 from 'uuid/v4';

import config from './config/config';

function getExpirationDate() {
  const lifetime = config.DATA_LIFETIME * 60
  let expirationDate = new Date();
  expirationDate.setSeconds(expirationDate.getSeconds() + lifetime);
  return Math.floor(expirationDate.getTime() / 1000)
}

function getUUID() {
  return uuidv4()
}

const FileRef = Joi.object().keys({
  base: Joi
    .string()
    .required(),
  path: Joi
    .string()
    .required(),
  dest: Joi
    .string()
});


const Bundle = {
  id: Joi
    .string()
    .default(getUUID, 'random id'),
  secret: Joi
    .string()
    .default(getUUID, 'random secret'),
  files: Joi
    .array()
    .unique()
    .default([])
    .items(FileRef),
  expirationDate: Joi
    .number()
    .default(getExpirationDate, 'expiration date'),
  filename: Joi
    .string()
}

export default { Bundle }
