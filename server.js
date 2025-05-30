
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('@homebridge/node-pty-prebuilt-multiarch');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// PostgreSQL (CockroachDB-compatible) config
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(bodyParser.json());
app.use(express.static('public'));

io.on('connection', (socket) => {
  const shell = process.env.SHELL || 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  ptyProcess.on('data', async (data) => {
    socket.emit('output', data);
    try {
      await pool.query(
        'INSERT INTO terminal_logs (session_id, output) VALUES ($1, $2)',
        [socket.id, data]
      );
    } catch (err) {
      console.error('DB insert error:', err);
    }
  });

  socket.on('input', async (input) => {
    ptyProcess.write(input);
    try {
      await pool.query(
        'INSERT INTO terminal_logs (session_id, input) VALUES ($1, $2)',
        [socket.id, input]
      );
    } catch (err) {
      console.error('DB insert error:', err);
    }
  });

  socket.on('resize', (size) => {
    ptyProcess.resize(size.cols, size.rows);
  });

  socket.on('disconnect', () => {
    ptyProcess.kill();
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server started');
});
