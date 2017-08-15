import path from 'path';
import { QueryFile } from 'pg-promise';


function loadSql(table_name, file, params = {}) {
  const fullPath = path.join(__dirname, file);
  const options = {
    minify: true,

    params: {
      table: table_name,
    }
  };
  return new QueryFile(fullPath, options);
}


export default function generateCommands(table_name) {
  const sql = loadSql.bind(null, table_name);

  return {
    create: sql('./sql/create.sql'),
    fetch: sql('./sql/fetch.sql'),
    fetchWithSecret: sql('./sql/fetch_w_secret.sql'),
  }
}