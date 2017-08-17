UPDATE ${table~}
SET files = files || ${files}::json[]
WHERE id = ${id} and secret = ${secret}
RETURNING *