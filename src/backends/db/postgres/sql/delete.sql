DELETE FROM ${table~}
WHERE id = ${id} AND secret = ${secret}
RETURNING *;