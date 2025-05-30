
const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname));

db.initDB();

app.post('/run', async (req, res) => {
  const cmd = req.body.command;
  exec(cmd, async (error, stdout, stderr) => {
    const output = stdout + (stderr || '');
    await db.query('INSERT INTO commands(command_text, output_text) VALUES ($1, $2)', [cmd, output]);
    res.send({ output });
  });
});

app.get('/history', async (req, res) => {
  const result = await db.query('SELECT command_text, output_text FROM commands ORDER BY id DESC LIMIT 50');
  res.send(result.rows);
});

app.post('/install', async (req, res) => {
  const pkg = req.body.package;
  await db.query('INSERT INTO packages(name) VALUES ($1)', [pkg]);
  res.send({ status: 'installed', package: pkg });
});

app.post('/login', async (req, res) => {
  const { service, credential } = req.body;
  await db.query('INSERT INTO logins(service, credential) VALUES ($1, $2)', [service, credential]);
  res.send({ status: 'logged in', service });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
