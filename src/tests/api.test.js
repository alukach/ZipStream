/**
 * This should test:
 *   -  Routes
 *   -  Controllers
 *   -  Param Validation
 */
import httpStatus from 'http-status';
import request from 'supertest-as-promised';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import { Readable } from 'stream';

import app from '../index';
import { db, fs } from '../backends';
import config from '../config/config';
import { NotFound } from '../helpers/errors';


chai.config.includeStack = true;


describe('## APIs', () => {
  const exampleBundle = {
    "expirationDate" : 1503029550,
    "secret" : "my-secret",
    "filename" : "my-awesome-bundle.zip",
    "files": [
      {
        "base": "my-aws-bucket-1",
        "path": "path/to/foo.jpg",
        "dest": "foo.jpg"
      },
      {
        "base": "some-other-bucket-2",
        "path": "bar.gif"
      }
    ],
    "id" : "my-long-id"
  };

  describe('# POST /', () => {
    beforeEach(() => {
      sinon.stub(db, "create");
    });

    afterEach(() => {
      db.create.restore();
    });

    it('should create bundle', (done) => {
      db.create.resolves(exampleBundle);

      request(app)
        .post(`/`)
        .send({ filename: exampleBundle.filename })
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(db.create.args.length)
            .to.equal(1);
          expect(db.create.firstCall.args.length)
            .to.equal(1);
          expect(res.body)
            .to.deep.equal(exampleBundle);
          done();
        })
        .catch(done);
    });

    it('should require \'filename\' argument', (done) => {
      request(app)
        .post(`/`)
        .send({})
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message)
            .to.equal('"filename" is required');
          done();
        })
        .catch(done);
    });

    it('should override \'id\' and \'secret\' arguments', (done) => {
      db.create.resolves(exampleBundle);

      request(app)
        .post(`/`)
        .send(exampleBundle)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(db.create.args.length)
            .to.equal(1);
          expect(db.create.firstCall.args.length)
            .to.equal(1);
          expect(db.create.firstCall.args[0].id)
            .to.be.a('string')
            .and.not.be.empty
            .and.to.not.equal(exampleBundle.id);
          expect(db.create.firstCall.args[0].secret)
            .to.be.a('string')
            .and.not.be.empty
            .and.to.not.equal(exampleBundle.secret);
          expect(db.create.firstCall.args[0].files)
            .to.deep.equal(exampleBundle.files);
          expect(db.create.firstCall.args[0].filename)
            .to.equal(exampleBundle.filename);
          expect(db.create.firstCall.args[0].expirationDate)
            .to.equal(exampleBundle.expirationDate);
          done();
        })
        .catch(done);
    });

    // TODO
    // it('should not allow bad \'files\' entry', (done) => {
    //   db.create.resolves(exampleBundle);
    //   request(app)
    //     .post(`/`)
    //     .send({ filename: exampleBundle.filename, files: 1 })
    //     .expect(httpStatus.BAD_REQUEST)
    //     .then((res) => {
    //       console.log(res.body);
    //       done();
    //     })
    //     .catch(done);
    // });
  });

  describe('# GET /:id', () => {

    beforeEach(() => {
      sinon.stub(db, "read");
      sinon.stub(fs, "getStream");
    });

    afterEach(() => {
      db.read.restore();
      fs.getStream.restore();
    });

    it('should return zipped bundle', (done) => {
      db.read.resolves(exampleBundle);
      var s = new Readable();
      s.push('A stream of data');
      s.push(null);
      fs.getStream.returns(s);

      request(app)
        .get(`/${exampleBundle.id}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const expectedDbReads = [
            [ { id: exampleBundle.id }, false ]
          ];
          const expectedStreamLookups = [
            [ exampleBundle.files[0].base, exampleBundle.files[0].path ],
            [ exampleBundle.files[1].base, exampleBundle.files[1].path ],
          ];
          expect(db.read.args)
            .to.deep.equal(expectedDbReads);
          expect(fs.getStream.args)
            .to.deep.equal(expectedStreamLookups);
          expect(res.text)
            .to.include('PK\u0003\u0004\u0014\u0000\b\u0000\b\u0000');
          expect(res.text)
            .to.include('foo.jpg');
          expect(res.text)
            .to.include('bar.gif');
          done();
        })
        .catch(done);
    });

    it('should handle bad combinations w/ 404', (done) => {
      db.read.rejects(NotFound);
      request(app)
        .get('/abcd')
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          const expectedDbRead = [
            {
              id: 'abcd',
            },
            false
          ];
          expect(db.read.args.length)
            .to.equal(1);
          expect(db.read.firstCall.args)
            .to.deep.equal(expectedDbRead);
          expect(res.body.message)
            .to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /:id/:secret', () => {
    beforeEach(() => {
      sinon.stub(db, "read");
    });

    afterEach(() => {
      db.read.restore();
    });

    it('should return bundle with good \'id\' and \'secret\' arguments', (done) => {
      db.read.resolves(exampleBundle);
      request(app)
        .get(`/${exampleBundle.id}/${exampleBundle.secret}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const expectedDbRead = [
              { id: exampleBundle.id, secret: exampleBundle.secret }
          ];
          expect(db.read.args.length)
            .to.equal(1);
          expect(db.read.firstCall.args)
            .to.deep.equal(expectedDbRead);
          expect(res.body)
            .to.deep.equal(exampleBundle);
          done();
        })
        .catch(done);
    });

    it('should handle bad combinations w/ 404', (done) => {
      db.read.rejects(NotFound);
      request(app)
        .get('/abcd/efgh')
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          const expectedDbReads = [
            { id: 'abcd', secret: 'efgh' }
          ];
          expect(db.read.args.length)
            .to.equal(1);
          expect(db.read.firstCall.args)
            .to.deep.equal(expectedDbReads);
          expect(res.body.message)
            .to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /:id/:secret', () => {
    beforeEach(() => {
      sinon.stub(db, "update");
    });

    afterEach(() => {
      db.update.restore();
    });

    it('should append to \'files\' array', (done) => {
      db.update.resolves(exampleBundle);
      request(app)
        .put(`/${exampleBundle.id}/${exampleBundle.secret}`)
        .send({ files: exampleBundle.files })
        .expect(httpStatus.OK)
        .then((res) => {
          const expectedDbUpdates = [
            {
              files: exampleBundle.files,
              id: exampleBundle.id,
              secret: exampleBundle.secret,
            }
          ];
          expect(db.update.firstCall.args.length)
            .to.equal(1);
          expect(db.update.firstCall.args)
            .to.deep.equal(expectedDbUpdates);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /:id/:secret', () => {
    beforeEach(() => {
      sinon.stub(db, "delete");
    });

    afterEach(() => {
      db.delete.restore();
    });

    it('should instruct DB to delete', (done) => {
      db.delete.resolves(exampleBundle);
      request(app)
        .delete(`/${exampleBundle.id}/${exampleBundle.secret}`)
        .expect(httpStatus.OK)
        .then((res) => {
          const expectedDbDelete = [
            {
              id: exampleBundle.id,
              secret: exampleBundle.secret,
            }
          ];
          expect(db.delete.firstCall.args.length)
            .to.equal(1);
          expect(db.delete.firstCall.args)
            .to.deep.equal(expectedDbDelete);
          done();
        })
        .catch(done);
    });

    it('should handle bad combinations w/ 404', (done) => {
      db.delete.rejects(NotFound);
      request(app)
        .delete('/abcd/efgh')
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          const expectedDbDelete = [
            {
              id: 'abcd',
              secret: 'efgh',
            }
          ];
          expect(db.delete.args.length)
            .to.equal(1);
          expect(db.delete.firstCall.args)
            .to.deep.equal(expectedDbDelete);
          expect(res.body.message)
            .to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });
});