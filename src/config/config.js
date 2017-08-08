import AWS from 'aws-sdk';
import Joi from 'joi';

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: Joi.number()
    .default(4040),

  DB_INTERFACE: Joi.string()
    .default('dynamodb'),
  FS_INTERFACE: Joi.string()
    .default('s3'),
  TABLE_NAME: Joi.string()
    .default('zipstream-bundles'),
  DATA_LIFETIME: Joi.number()  // in minutes
    .default(60 * 24 * 7),

  AWS_REGION: Joi.string()
    .default('us-west-2'),
}).required();

const config = Joi.validate(
  process.env, envVarsSchema, {stripUnknown: true},
  (err, value) => {
  if (err) throw new Error(`Config validation error: ${err.message}`);

  AWS.config.region = value.AWS_REGION;
  return value
});

export default config;
