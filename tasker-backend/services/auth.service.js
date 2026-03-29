const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-production";

async function login(email, password) {
  const result = await pool.query(
    "SELECT id, name, email, password FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) return null;

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return { id: user.id, name: user.name, email: user.email, token };
}

module.exports = { login };
