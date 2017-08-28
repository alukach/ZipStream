import { parse } from 'url';

import winston from 'winston';
import archiver from 'archiver';

import { fs } from '../backends';


function streamToRes(res, next, files, filename = '') {
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  res.attachment(filename);
  res.contentType('application/octet-stream');

  archive
    .on('warning', (err) => {
      if (err.code === 'ENOENT') {
        winston.warn(err);
      } else {
        next(err);
      }
    })
    .on('error', next);
  archive
    .pipe(res);

  // Remove files that repeat earlier `dst` values
  const filesMap = new Map();
  for (let { src, dst } of files) {  // eslint-disable-line prefer-const
    if (!dst) {
      dst = parse(src).path;
    }
    if (!filesMap.has(dst)) {
      filesMap.set(dst, src);
    }
  }

  // Enqueue streams
  const zipDir = filename.replace(/\.[^/.]+$/, '');
  for (const [dst, src] of filesMap) {
    const protocol = parse(src).protocol.split(':')[0];
    const _interface = fs[protocol];
    if (_interface === undefined) {
      return res.status(400).json({
        message: `Protocol '${protocol}' not supported.`
      });
    }
    winston.debug(`Enqueueing '${src}'`);
    const data = _interface
      .getStream(src)
      // Reject seems to be useless once data has started to be streamed
      // to the response object. Instead, use `next`
      // https://github.com/expressjs/express/issues/2700
      .on('error', (err) => {
        res.status(500);
        return next(err);
      });

    archive.append(data, { name: dst, prefix: zipDir });
  }
  archive.finalize();
  return archive;
}

export default { streamToRes };
