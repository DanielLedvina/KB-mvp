const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "tasker",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5433,
});

module.exports = pool;
