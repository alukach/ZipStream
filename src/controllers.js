import { parse } from 'url';
import Joi from 'joi';
import archiver from 'archiver';

import { Bundle } from './models';
import { db, fs } from './backends';


function getStreamResponse(res, {files, filename = '', id}) {
  return new Promise((resolve, reject) => {
    var archive = archiver('zip', {
        zlib: { level: 9 }
    });

    archive
      .on('warning', err => {
        if (err.code === 'ENOENT') {
            console.warn(err)
        } else {
            next(err);
        }
      })
      .on('error', err => { next(err) })
      .pipe(res);

    res.attachment(filename);
    res.contentType("application/octet-stream")

    // Remove files that repeat earlier `dst` values
    let filesMap = new Map();
    for ( let {src, dst} of files ) {
      if (!dst) {
        dst = parse(src).path;
      }
      if (!filesMap.has(dst)) {
          filesMap.set(dst, src)
      }
    }

    // Enqueue streams
    let zipDir = filename.replace(/\.[^/.]+$/, "");
    for ( const [dst, src] of filesMap ) {
      const protocol = parse(src).protocol.split(':')[0];
      const _interface = fs[protocol];
      if (_interface === null) {
        // TODO: throw 400
      }
      let data = _interface
        .getStream(src)
        .on('error', function(err) {
          console.error(
            `${id}: ` +
            `READSTREAM error: "${err.message}", ` +
            `src: ${src}, ` +
            `dst: ${dst}`
          );
          reject(err);
        })
      archive.append(data, { name: dst, prefix: zipDir });
    }
    archive.finalize();
    resolve()
  });
}


const bundleCtrl = {
  /**
   * Create new bundle
   * @returns {Bundle}
   */
  create: (req, res, next) => {
    let body = req.body;
    delete body['id'];
    delete body['secret'];
    const {err, value} = Joi.validate(body, Bundle);
    if (err) throw new Error(`Config validation err: ${err.message}`);
    return db.create(value)
      .then(val => {
        console.log(val);
        res.status(201).json(val);
      })
      .catch(next)
  },

  /**
   * Retrieve bundle information
   * @returns {Bundle}
   */
  read: (req, res, next) => {
    return db.read(req.params)
      .then(val => res.json(val))
      .catch(next)
  },

  /**
   * Append files to bundle
   * @returns {Bundle}
   */
  update: (req, res, next) => {
    return db.update(Object.assign(req.body, req.params))
      .then(val => res.json(val))
      .catch(next)
  },

  /**
   * Delete bundle
   * @returns {Bundle}
   */
  delete: (req, res, next) => {
    return db.delete(req.params)
      .then(val => res.json(val))
      .catch(next)
  },

  /**
   * Stream zip of files
   * @returns {Stream}
   */
  download: (req, res, next) => {
    return db.read(req.params, false)
      .then(val => {
        getStreamResponse(res, val)
          .catch(next);
      })
      .catch(next)
  },

  /**
   * Stream zip of files
   * @returns {Stream}
   */
  bundle: (req, res, next) => {
    return getStreamResponse(res, req.body)
      .catch(next)
  },
}

export default { bundleCtrl }