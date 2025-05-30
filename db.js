
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initDB = async () => {
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS commands (
      id SERIAL PRIMARY KEY,
      command_text TEXT NOT NULL,
      output_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  \`);

  await pool.query(\`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  \`);

  await pool.query(\`
    CREATE TABLE IF NOT EXISTS logins (
      id SERIAL PRIMARY KEY,
      service TEXT NOT NULL,
      credential TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  \`);
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDB
};
