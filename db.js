require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS commands (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      command_text TEXT NOT NULL,
      output_text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      installed_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS logins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service TEXT NOT NULL,
      credential TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDB,
};
