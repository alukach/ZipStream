import Joi from 'joi';
import archiver from 'archiver';

import { Bundle } from './models';
import config from './config/config';
import db from './backends/db';
import fs from './backends/fs';

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
    return db.read(Object.assign(req.body, req.params))
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
    return db.delete(Object.assign(req.body, req.params))
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

    return db.read(Object.assign(req.body, req.params), false)
      .then(val => {
        res.attachment(val.filename);
        res.contentType("application/octet-stream")

        // Remove duplicates
        let cache = new Map();
        for ( const {base, path, dest} of val.files ) {
          if (!cache.has(base)) cache.set(base, []);
          // TODO: Fixup to new object style key
          let files = cache.get(base);
          if (!files.some(v => v.path == path)) files.push({ path, dest })
        }

        // Enqueue streams
        for ( const [base, files] of cache ) {
          for ( const {path, dest} of files ) {
            let data = fs
              .getStream(base, path)
              .on('error', function(err) {
                console.error(
                  `${val.id}: ` +
                  `READSTREAM error: "${err.message}", ` +
                  `base: ${base}, ` +
                  `path: ${path}`
                );
              })
            archive.append(data, { name: dest || path });
          }
        }
        archive.finalize();
      })
      .catch(next)
  },
}

export default { bundleCtrl }