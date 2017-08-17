import { parse } from 'url';
import Joi from 'joi';
import archiver from 'archiver';
import winston from 'winston';

import { Bundle } from './models';
import { db, fs } from './backends';


function getStreamResponse(res, { files, filename = '', id }) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive
      .on('warning', (err) => {
        if (err.code === 'ENOENT') {
          winston.warn(err);
        } else {
          reject(err);
        }
      })
      .on('error', (err) => { reject(err); })
      .pipe(res);

    res.attachment(filename);
    res.contentType('application/octet-stream');

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
      const data = _interface
        .getStream(src)
        .on('error', (err) => {
          winston.error(
            `${id}: ` +
            `READSTREAM error: '${err.message}', ` +
            `src: ${src}, ` +
            `dst: ${dst}`
          );
          return reject(err);
        });
      archive.append(data, { name: dst, prefix: zipDir });
    }
    archive.finalize();
    return resolve();
  });
}


const bundleCtrl = {
  /**
   * Create new bundle
   * @returns {Bundle}
   */
  create: (req, res, next) => {
    const body = req.body;
    delete body.id;
    delete body.secret;
    delete body.expirationDate;
    const { error, value } = Joi.validate(body, Bundle);
    if (error) throw new Error(`Config validation error: ${error.message}`);
    return db.create(value)
      .then(val => res.status(201).json(val))
      .catch(next);
  },

  /**
   * Retrieve bundle information
   * @returns {Bundle}
   */
  read: (req, res, next) => (
    db.read(req.params)
      .then(val => res.json(val))
      .catch(next)
  ),

  /**
   * Append files to bundle
   * @returns {Bundle}
   */
  update: (req, res, next) => (
    db.update(Object.assign(req.body, req.params))
      .then(val => res.json(val))
      .catch(next)
  ),

  /**
   * Delete bundle
   * @returns {Bundle}
   */
  delete: (req, res, next) => (
    db.delete(req.params)
      .then(val => res.json(val))
      .catch(next)
  ),

  /**
   * Stream zip of files
   * @returns {Stream}
   */
  download: (req, res, next) => (
    db.read(req.params, false)
      .then(val => (
        getStreamResponse(res, val)
          .catch(next)
      ))
      .catch(next)
  ),

  /**
   * Stream zip of files
   * @returns {Stream}
   */
  bundle: (req, res, next) => (
    getStreamResponse(res, req.body)
      .catch(next)
  ),
};

export default { bundleCtrl, getStreamResponse };
