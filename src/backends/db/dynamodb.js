/* eslint no-param-reassign: ["error", { "props": false }] */
import AWS from 'aws-sdk';

import { APIError, fromEnv } from '../../helpers/errors';


export default class DynamoDb {
  constructor({ TABLE_NAME = fromEnv('TABLE_NAME'), AWS_REGION = fromEnv('AWS_REGION') }) {
    this.table = TABLE_NAME;
    AWS.config.region = AWS_REGION;
    this.dynamoDb = new AWS.DynamoDB.DocumentClient();
  }

  /**
   * Recast exeptions as exceptions that will be handled by middleware.
   * @param  {err} err Error to be reformatted
   * @throws {err}     Middleware-friendly error
   */
  formatError(err) { // eslint-disable-line class-methods-use-this
    if (err.code === 'ConditionalCheckFailedException') {
      throw new APIError(err.message, 404);
    }
    throw new APIError(err.message, 500);
  }

  create(value) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.table,
        Item: value,
      };
      value.expirationDate = Math.floor(value.expirationDate.getTime() / 1000);
      this.dynamoDb.put(params, (err, data) => {
        if (err) return reject(err);
        return resolve(data.Attributes);
      });
    });
  }

  read({ id, secret }, checkPass = true) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.table,
        Key: { id }
      };
      this.dynamoDb.get(params, (err, data) => {
        if (err) return reject(this.formatError(err));
        if (!Object.keys(data).length) {
          return reject(this.errors.NotFound);
        }

        const item = data.Item;
        if (checkPass && item.secret !== secret) {
          return reject(this.errors.NotFound);
        }
        return resolve(item);
      });
    });
  }

  update({ id, secret, files }) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.table,
        Key: { id },
        ConditionExpression: 'secret = :secret',
        ExpressionAttributeNames: {
          '#attrName': 'files',
        },
        ExpressionAttributeValues: {
          ':newKeys': files,
          ':secret': secret,
        },
        UpdateExpression: 'SET #attrName = list_append(#attrName, :newKeys)',
        ReturnValues: 'ALL_NEW',
      };
      this.dynamoDb.update(params, (err, data) => (
        err ? reject(this.formatError(err)) : resolve(data.Attributes)
      ));
    });
  }

  delete({ id, secret }) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.table,
        Key: { id },
        ConditionExpression: 'secret = :secret',
        ExpressionAttributeValues: {
          ':secret': secret,
        },
        ReturnValues: 'ALL_OLD',
      };
      this.dynamoDb.delete(params, (err, data) => (
        err ? reject(this.formatError(err)) : resolve(data.Attributes)
      ));
    });
  }
}
