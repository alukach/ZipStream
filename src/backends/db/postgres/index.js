import path from 'path';

import pgPromise from 'pg-promise';
import { QueryFile } from 'pg-promise';
import { queryResultErrorCode } from 'pg-promise/lib/errors';


function sqlLoader(table_name, file, params = {}) {
  const fullPath = path.join(__dirname, file);
  const options = {
    minify: true,
    params: { table: table_name },
  };
  return new QueryFile(fullPath, options);
}


export default class PostgresDb {
  constructor(config, errors) {
    const pgp = pgPromise();
    this.db = pgp({database: config.DB_NAME});
    this.sql = sqlLoader.bind(this, config.TABLE_NAME)
    this.errors = errors;
  }

  formatError(err) {
    if (err.code == queryResultErrorCode.noData) {
      return this.errors.NotFound;
    }
    return err
  }

  create(val) {
    return new Promise((resolve, reject) => {
      this.db.none(this.sql('./sql/create.sql'), val).then(() => {
        resolve(val)
      });
    });
  }

  read({id, secret = null}, checkPass = true) {
    const sql = checkPass ?
      this.sql('./sql/fetch_w_secret.sql') :
      this.sql('./sql/fetch.sql');
    const params = Object.assign({ id }, checkPass ? { secret } : { } );
    return this.db.one(sql, params)
      .catch(err => {
        throw this.formatError(err);
      })
  }

  update(val) {
    return this.db.one(this.sql('./sql/update.sql'), val)
      .catch(err => {
        throw this.formatError(err);
      })
  }

  delete(val) {
    return this.db.one(this.sql('./sql/delete.sql'), val)
      .catch(err => {
        throw this.formatError(err);
      })
  }
}