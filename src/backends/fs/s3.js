import { parse } from 'url';

import AWS from 'aws-sdk';

import config from '../../config/config';

AWS.config.region = config.AWS_REGION;
const s3 = new AWS.S3();

export default {
  getStream(src) {
    const bucket = parse(src).host;
    const key = parse(src).path;
    return s3
      .getObject({ Bucket: bucket, Key: key })
      .createReadStream();
  }
};
