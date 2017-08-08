import AWS from 'aws-sdk';

import config from '../../config/config';
import { NotFound } from '../../helpers/errors';

const s3 = new AWS.S3({apiVersion: '2006-03-01'});

export default {
  getStream(bucket, key) {
    let params = { Bucket: bucket, Key: key };
    return s3
      .getObject(params)
      .createReadStream();
  }
}