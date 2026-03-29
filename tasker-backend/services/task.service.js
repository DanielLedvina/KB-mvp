const pool = require("../db");

async function getAll() {
  const result = await pool.query("SELECT * FROM tasks");
  return result.rows;
}

async function create(title, tag, description) {
  const result = await pool.query(
    "INSERT INTO tasks (title, tag, description) VALUES ($1, $2, $3) RETURNING *",
    [title, tag || "DEFAULT", description || ""]
  );
  return result.rows[0];
}

async function update(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) return null;

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  values.push(id);

  const result = await pool.query(
    `UPDATE tasks SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

async function remove(id) {
  const result = await pool.query(
    "DELETE FROM tasks WHERE id = $1",
    [id]
  );
  return result.rowCount > 0;
}

module.exports = { getAll, create, update, remove };
