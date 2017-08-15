import AWS from 'aws-sdk';

import config from '../../config/config';
import { NotFound } from '../../helpers/errors';

const dynamoDb = new AWS.DynamoDB.DocumentClient();


function formatError(err) {
  if (err.code == "ConditionalCheckFailedException") return NotFound;
  err.status = err.statusCode;
  return err
}


export default {

  create: (value) => new Promise((resolve, reject) => {
    const params = {
      TableName: config.TABLE_NAME,
      Item: value,
    };
    dynamoDb.put(params, (err, data) => {
      if (err) return reject(err);
      return resolve(value)
    });
  }),


  read: ({id, secret}, checkPass = true) => new Promise((resolve, reject) => {
    const params = {
      TableName: config.TABLE_NAME,
      Key: {
        id: id,
      }
    };
    dynamoDb.get(params, (err, data) => {
      if (err ) return reject(formatError(err));
      if (!Object.keys(data).length) return reject(NotFound);

      data = data['Item'];
      if (checkPass && data.secret != secret) return reject(NotFound);
      return resolve(data)
    });
  }),


  update: ({id, secret, files}) => new Promise((resolve, reject) => {
    const params = {
      TableName: config.TABLE_NAME,
      Key: {
        id: id,
      },
      ConditionExpression: "secret = :secret",
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
    dynamoDb.update(params, (err, data) => {
      err ? reject(formatError(err)) : resolve(data['Attributes']);
    });
  }),


  delete: ({id, secret}) => new Promise((resolve, reject) => {
    const params = {
      TableName: config.TABLE_NAME,
      Key: {
        id: id,
      },
      ConditionExpression: "secret = :secret",
      ExpressionAttributeValues: {
        ':secret': secret,
      },
      ReturnValues: 'ALL_OLD',
    };
    dynamoDb.delete(params, (err, data) => {
      err ? reject(formatError(err)) : resolve(data['Attributes']);
    });
  }),
}