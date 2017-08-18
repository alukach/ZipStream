import path from 'path';

import pgPromise from 'pg-promise';
import { queryResultErrorCode } from 'pg-promise/lib/errors';


function sqlLoader(tableName, file) {
  const fullPath = path.join(__dirname, file);
  const options = {
    minify: true,
    params: { table: tableName },
  };
  return new pgPromise.QueryFile(fullPath, options);
}


export default class PostgresDb {
  constructor(config, errors) {
    const pgp = pgPromise();
    this.db = pgp({ database: config.DB_NAME });

    const loadSql = sqlLoader.bind(this, config.TABLE_NAME);
    this.cmds = {
      create: loadSql('./sql/create.sql'),
      fetch_w_secret: loadSql('./sql/fetch_w_secret.sql'),
      fetch: loadSql('./sql/fetch.sql'),
      update: loadSql('./sql/update.sql'),
      delete: loadSql('./sql/delete.sql'),
    }

    this.errors = errors;
  }

  /**
   * Recast exeptions as exceptions that will be handled by middleware.
   * @param  {err} err Error to be reformatted
   * @throws {err}     Middleware-friendly error
   */
  formatError(err) {
    if (err.code === queryResultErrorCode.noData) {
      throw this.errors.NotFound;
    }
    throw err;
  }

  create(val) {
    return new Promise((resolve, reject) => {
      this.db.none(this.cmds.create, val)
        .then(() => resolve(val))
        .catch(this.formatError);
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
