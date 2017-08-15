import { parse } from 'url';
import Joi from 'joi';
import archiver from 'archiver';

import { Bundle } from './models';
import { db, fs } from './backends';

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
      .then(val => res.status(201).json(val))
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

    return db.read(req.params, false)
      .then(val => {
        res.attachment(val.filename);
        res.contentType("application/octet-stream")

        // Remove files that repeat earlier `dst` values
        let files = new Map();
        for ( let {src, dst} of val.files ) {
          if (!dst) {
            dst = parse(src).path;
          }
          if (!files.has(dst)) {
              files.set(dst, src)
          }
        }

        // Enqueue streams
        for ( const [dst, src] of files ) {
          const protocol = parse(src).protocol.split(':')[0];
          const _interface = fs[protocol];
          if (_interface === null) {
            // throw 400
          }
          let data = _interface
            .getStream(src)
            .on('error', function(err) {
              console.error(
                `${val.id}: ` +
                `READSTREAM error: "${err.message}", ` +
                `src: ${src}, ` +
                `dst: ${dst}`
              );
            })
          archive.append(data, { name: dst });
        }
        archive.finalize();
      })
      .catch(next)
  },
}

export default { bundleCtrl }