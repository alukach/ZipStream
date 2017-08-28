import Joi from 'joi';

import { Bundle } from './models';
import { db } from './backends';
import { streamToRes } from './helpers/stream';


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
      .then(val => streamToRes(res, next, val.files, val.filename))
      .catch(next)
  ),

  /**
   * Stream zip of files
   * @returns {Stream}
   */
  bundle: (req, res, next) => {
    try {
      streamToRes(res, next, req.body.files, req.body.filename);
    } catch (e) {
      next(e);
    }
  },
};

export default { bundleCtrl, streamToRes };
