import path from 'path';

import pgPromise from 'pg-promise';
import { queryResultErrorCode } from 'pg-promise/lib/errors';

import { APIError, fromEnv } from '../../../helpers/errors';


function sqlLoader(tableName, file) {
  const fullPath = path.join(__dirname, file);
  const options = {
    minify: true,
    params: { table: tableName },
  };
  return new pgPromise.QueryFile(fullPath, options);
}


export default class PostgresDb {
  constructor({ DB_CNXN = fromEnv('DB_CNXN'), TABLE_NAME = fromEnv('TABLE_NAME'), NODE_ENV }) {
    const pgp = pgPromise({ noLocking: NODE_ENV === 'test' });  // Needed stub in testing
    this.db = pgp(DB_CNXN);

    const loadSql = sqlLoader.bind(this, TABLE_NAME);
    this.cmds = {
      create: loadSql('./sql/create.sql'),
      fetch_w_secret: loadSql('./sql/fetch_w_secret.sql'),
      fetch: loadSql('./sql/fetch.sql'),
      update: loadSql('./sql/update.sql'),
      delete: loadSql('./sql/delete.sql'),
    };
  }

  /**
   * Recast exeptions as exceptions that will be handled by middleware.
   * @param  {err} err Error to be reformatted
   * @throws {err}     Middleware-friendly error
   */
  formatError(err) {  // eslint-disable-line class-methods-use-this
    if (err.code === queryResultErrorCode.noData) {
      throw new APIError(err.message, 404);
    }
    throw new APIError(err.message, 500);
  }

  create(val) {
    return new Promise((resolve, reject) => {
      this.db.none(this.cmds.create, val)
        .then(() => resolve(val))
        .catch(reject);
    });
  }

  read({ id, secret = null }, checkPass = true) {
    const sql = checkPass ?
      this.cmds.fetch_w_secret :
      this.cmds.fetch;
    const params = Object.assign({ id }, checkPass ? { secret } : { });
    return this.db.one(sql, params)
      .catch(this.formatError);
  }

  update(val) {
    return this.db.one(this.cmds.update, val)
      .catch(this.formatError);
  }

  delete(val) {
    return this.db.one(this.cmds.delete, val)
      .catch(this.formatError);
  }
}
