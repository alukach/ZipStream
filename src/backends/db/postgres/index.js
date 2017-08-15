import path from 'path';

import pgPromise from 'pg-promise';
import { QueryFile } from 'pg-promise';
import { queryResultErrorCode } from 'pg-promise/lib/errors';

import generateCommands from './commands'


export default class PostgresDb {
  constructor(config, errors) {
    const pgp = pgPromise();
    this.db = pgp({database: config.DB_NAME});
    this.sql = generateCommands(config.TABLE_NAME)
    this.errors = errors;
  }

  formatError(err) {
    if (err.code == queryResultErrorCode.noData) {
      return this.errors.NotFound;
    }
    return err
  }

  create(val) {
    return this.db.none(this.sql.create, val);
  }

  read({id, secret = null}, checkPass = true) {
    const sql = checkPass ? this.sql.fetchWithSecret : this.sql.fetch;
    const params = Object.assign({ id }, checkPass ? { secret } : { } );
    return this.db.one(sql, params)
      .catch(err => {
        throw this.formatError(err);
      })
  }

  // update

  // delete
}