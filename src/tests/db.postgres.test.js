import sinon from 'sinon';
import chai, { expect } from 'chai';

import { db } from '../backends';


chai.config.includeStack = true;


describe('DB Backend - postgres:', () => {
  beforeEach(() => {
    sinon.stub(db.db, 'none');
    sinon.stub(db.db, 'one');
    sinon.stub(db, 'formatError');
  });

  afterEach(() => {
    db.db.none.restore();
    db.db.one.restore();
    db.formatError.restore();
  });

  describe('db.create', () => {
    const exampleBundle = {
      secret: 'my-secret',
      filename: 'my-awesome-bundle.zip',
      id: 'my-long-id'
    };

    it('should run creation sql, return input value', (done) => {
      db.db.none.resolves(exampleBundle);
      db.create(exampleBundle)
        .then((val) => {
          expect(val)
            .to.equal(exampleBundle);
          expect(db.db.none.args)
            .to.deep.equal([[db.cmds.create, exampleBundle]]);
          done();
        })
        .catch(done);
    });

    it('should reject on db errors', (done) => {
      db.db.none.rejects(new Error('Something went wrong'));
      db.create(exampleBundle)
        .catch((err) => {
          expect(err)
            .to.be.an.instanceOf(Error)
            .that.has.property('message', 'Something went wrong');
          done();
        });
    });
  });

  describe('db.read', () => {
    const exampleBundle = {
      expirationDate: '2017-08-24T17:33:35.961Z',
      secret: 'my-secret',
      filename: 'my-awesome-bundle.zip',
      files: [
        {
          src: 's3://my-aws-bucket-1/path/to/foo.jpg',
          dst: 'foo.jpg'
        },
        {
          src: 's3://some-other-bucket-2/bar.gif'
        }
      ],
      id: 'my-long-id'
    };

    it('should retrieve with secret by default', (done) => {
      db.db.one.resolves(exampleBundle);
      db.read({ id: exampleBundle.id, secret: exampleBundle.secret })
        .then((val) => {
          expect(val)
            .to.equal(exampleBundle);
          expect(db.db.one.args)
            .to.deep.equal(
              [[db.cmds.fetch_w_secret, { id: exampleBundle.id, secret: exampleBundle.secret }]]);
          done();
        })
        .catch(done);
    });

    it('should retrieve without secret if checkPass === false', (done) => {
      db.db.one.resolves(exampleBundle);
      db.read({ id: exampleBundle.id }, false)
        .then((val) => {
          expect(val)
            .to.equal(exampleBundle);
          expect(db.db.one.args)
            .to.deep.equal(
              [[db.cmds.fetch, { id: exampleBundle.id }]]);
          done();
        })
        .catch(done);
    });

    it('should run thrown errors through formatError', (done) => {
      db.db.one.rejects(new Error('Something went wrong'));
      db.formatError.rejects(new Error('A different error'));
      db.read({ id: exampleBundle.id })
        .catch((err) => {
          expect(db.formatError.args)
            .to.deep.equal(
              [[new Error('Something went wrong')]]);
          expect(err)
            .to.be.an.instanceOf(Error)
            .that.has.property('message', 'A different error');
          done();
        });
    });
  });

  describe('db.update', () => {
    const exampleBundle = {
      secret: 'my-secret',
      filename: 'my-awesome-bundle.zip',
      id: 'my-long-id'
    };

    it('should run update sql, return input value', (done) => {
      db.db.one.resolves(exampleBundle);
      db.update(exampleBundle)
        .then((val) => {
          expect(val)
            .to.equal(exampleBundle);
          expect(db.db.one.args)
            .to.deep.equal([[db.cmds.update, exampleBundle]]);
          done();
        })
        .catch(done);
    });

    it('should run thrown errors through formatError', (done) => {
      db.db.one.rejects(new Error('Something went wrong'));
      db.formatError.rejects(new Error('A different error'));
      db.update(exampleBundle)
        .catch((err) => {
          expect(db.formatError.args)
            .to.deep.equal(
              [[new Error('Something went wrong')]]);
          expect(err)
            .to.be.an.instanceOf(Error)
            .that.has.property('message', 'A different error');
          done();
        });
    });
  });

  describe('db.delete', () => {
    const exampleBundle = {
      secret: 'my-secret',
      filename: 'my-awesome-bundle.zip',
      id: 'my-long-id'
    };

    it('should run delete sql, return input value', (done) => {
      db.db.one.resolves(exampleBundle);
      db.delete(exampleBundle)
        .then((val) => {
          expect(val)
            .to.equal(exampleBundle);
          expect(db.db.one.args)
            .to.deep.equal([[db.cmds.delete, exampleBundle]]);
          done();
        })
        .catch(done);
    });

    it('should run thrown errors through formatError', (done) => {
      db.db.one.rejects(new Error('Something went wrong'));
      db.formatError.rejects(new Error('A different error'));
      db.delete(exampleBundle)
        .catch((err) => {
          expect(db.formatError.args)
            .to.deep.equal(
              [[new Error('Something went wrong')]]);
          expect(err)
            .to.be.an.instanceOf(Error)
            .that.has.property('message', 'A different error');
          done();
        });
    });
  });
});
