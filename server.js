
// server.js - Termux-style real-time terminal backend

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const pool = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', socket => {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });

    ptyProcess.on('data', async data => {
        socket.emit('output', data);
        await pool.query('INSERT INTO terminal_logs (type, content) VALUES ($1, $2)', ['output', data]);
    });

    socket.on('input', async input => {
        ptyProcess.write(input);
        await pool.query('INSERT INTO terminal_logs (type, content) VALUES ($1, $2)', ['input', input]);
    });

    socket.on('resize', ({ cols, rows }) => {
        ptyProcess.resize(cols, rows);
    });

    socket.on('disconnect', () => {
        ptyProcess.kill();
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port 3000');
});
