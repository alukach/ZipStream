import { parse } from 'url';

import winston from 'winston';
import archiver from 'archiver';

import util from 'archiver-utils';

import { fs } from '../backends';


function streamToResponse(response, next, files, filename = '') {
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  response.attachment(filename);
  response.contentType('application/octet-stream');

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
    .pipe(response);

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

  const queue = Array.from(filesMap);

  new Promise((resolve, reject) => {
    // Setup archive to trigger next request after each file is added
    archive
      .on('entry', function(entryData) {
        var data = queue.pop();
        if (data === undefined) {
          return resolve()
        }
        return fetch(data)
         .catch(reject);
      })

    // Initiate requests
    if (queue.length === 0) return reject("Empty queue");
    return fetch(queue.pop())
      .catch(reject);
  })
  .then(values => {
    console.log("Finalized");
    archive.finalize();
  })
  .catch(err => {
    console.error(err);
    archive.abort();
  })

  function fetch(data) {
    const [dst, src] = data;
    const protocol = parse(src).protocol.split(':')[0];
    const _interface = fs[protocol];
    if (_interface === undefined) {
      return res.status(400).json({
        message: `Protocol '${protocol}' not supported.`
      });
    }
    console.log('fetching ' + dst + ': ' + src);
    // winston.debug(`Enqueueing '${src}'`);
    return Promise.all([
      dst,
      _interface.get(src)
    ])
    .then(data => {
      const [dst, srcStream] = data;
      archive.append(srcStream, { name: dst, prefix: 'out' });
    })
  }
  return archive;
}

export default { streamToResponse };
