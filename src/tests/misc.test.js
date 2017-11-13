import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../index';

chai.config.includeStack = true;

describe('Misc:', () => {
  describe('GET /', () => {
    it('should return 404 error', (done) => {
      request(app)
        .get('/')
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

  describe('GET /health-check', () => {
    it('should return OK', (done) => {
      request(app)
        .get('/health-check')
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.text).to.equal('OK');
          done();
        })
        .catch(done);
    });
  });

  describe('Error Handling', () => {
    it('should handle express validation error - username is required', (done) => {
      request(app)
        .post('/')
        .send({
        })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('"filename" is required');
          done();
        })
        .catch(done);
    });
  });
});
