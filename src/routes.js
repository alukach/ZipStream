import express from 'express';
import validate from 'express-validation';
import paramValidation from './param-validation';
import { bundleCtrl } from './controllers';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

router.route('/')
  /** POST / - Create new bundle */
  .post(
    validate(paramValidation.createBundle),
    bundleCtrl.create);

router.route('/bundle')
  /** POST / - Create new bundle */
  .post(
    validate(paramValidation.instantDownloadBundle),
    bundleCtrl.bundle);

router.route('/:id')
  /** GET /:id - Download zip of bundle */
  .get(
    validate(paramValidation.downloadBundle),
    bundleCtrl.download);

router.route('/:id/:secret')
  /** GET /:id/:secret - Get bundle information */
  .get(
    validate(paramValidation.protectedReadBundle),
    bundleCtrl.read)

  /** PUT /:id/:secret - Append to a bundle */
  .put(
    validate(paramValidation.updateBundle),
    bundleCtrl.update)

  /** DELETE /:id/:secret - Delete bundle */
  .delete(
    validate(paramValidation.protectedReadBundle),
    bundleCtrl.delete);

export default router;
