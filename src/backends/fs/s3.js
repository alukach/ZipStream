import { parse } from 'url';

import AWS from 'aws-sdk';

import config from '../../config/config';

AWS.config.region = config.AWS_REGION;
const s3 = new AWS.S3();

export default {
  getStream(src) {
    let bucket = parse(src).host;
    let key = parse(src).path;
    return s3
      .getObject({ Bucket: bucket, Key: key })
      .createReadStream();
  }
}