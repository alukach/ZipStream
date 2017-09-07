import { parse } from 'url';

import async from 'async';
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
    .on('error', next)
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

  // Validate sources
  for (const [dst, src] of filesMap) {
    const protocol = parse(src).protocol.split(':')[0];
    const _interface = fs[protocol];
    if (_interface === undefined) {
      return res.status(400).json({
        message: `Protocol '${protocol}' not supported.`
      });
    }
  }

  const zipDir = filename.replace(/\.[^/.]+$/, '');
  const finalize = () => archive.finalize();
  async.eachLimit(filesMap, 1, ([dst, src], handleNext) => {
    const protocol = parse(src).protocol.split(':')[0];
    const _interface = fs[protocol];
    const data = _interface
      .getStream(src)
      // Reject seems to be useless once data has started to be streamed
      // to the response object. Instead, use `next`
      // https://github.com/expressjs/express/issues/2700
      .on('error', (err) => {
        res.status(500);
        return next(err);
      })
      .on('end', handleNext);
    archive.append(data, { name: dst, prefix: zipDir });

  }, finalize);
}

export default { streamToRes };
