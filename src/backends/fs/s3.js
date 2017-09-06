import { parse } from 'url';

import AWS from 'aws-sdk';

import config from '../../config/config';

AWS.config.region = config.AWS_REGION;
const s3 = new AWS.S3();

export default {
  get(src) {
    return new Promise((resolve, reject) => {
      try {
        const bucket = parse(src).host;
        const key = parse(src).path.replace(/^\/|\/$/g, ''); // Strip slashes
        return resolve(
          s3
            .getObject({ Bucket: bucket, Key: key })
            .createReadStream()
        )
      } catch (err) {
        return reject(err)
      }
    })
  }
};
