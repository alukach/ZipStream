import AWS from 'aws-sdk';


export default class DynamoDb {
  constructor(config, errors) {
    this.table = config.TABLE_NAME;
    this.errors = errors;
    AWS.config.region = config.AWS_REGION;
    this.dynamoDb = new AWS.DynamoDB.DocumentClient();
  }

  formatError(err) {
    if (err.code == "ConditionalCheckFailedException") {
      return this.errors.NotFound;
    }
    err.status = err.statusCode;
    return err
  }

  create(value) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.table,
        Item: value,
      };
      value.expirationDate = Math.floor(value.expirationDate.getTime() / 1000)
      this.dynamoDb.put(params, (err, data) => {
        if (err) return reject(err);
        return resolve(value)
      });
    });
  }

  read({id, secret}, checkPass = true) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.table,
        Key: {
          id: id,
        }
      };
      this.dynamoDb.get(params, (err, data) => {
        if (err ) return reject(this.formatError(err));
        if (!Object.keys(data).length) {
          return reject(this.errors.NotFound);
        }

        data = data['Item'];
        if (checkPass && data.secret != secret) {
          return reject(this.errors.NotFound);
        }
        return resolve(data)
      });
    });
  }

  update({id, secret, files}) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.table,
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
      this.dynamoDb.update(params, (err, data) => {
        err ? reject(this.formatError(err)) : resolve(data['Attributes']);
      });
    });
  }

  delete({id, secret}) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.table,
        Key: {
          id: id,
        },
        ConditionExpression: "secret = :secret",
        ExpressionAttributeValues: {
          ':secret': secret,
        },
        ReturnValues: 'ALL_OLD',
      };
      this.dynamoDb.delete(params, (err, data) => {
        err ? reject(this.formatError(err)) : resolve(data['Attributes']);
      });
    });
  }
}