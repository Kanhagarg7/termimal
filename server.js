
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const pty = require("node-pty");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

wss.on("connection", function (ws) {
  const shell = pty.spawn("bash", [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env,
  });

  shell.onData(async function (data) {
    ws.send(data);
    await pool.query("INSERT INTO logs (output, created_at) VALUES ($1, NOW())", [data]);
  });

  ws.on("message", async function (msg) {
    shell.write(msg);
    await pool.query("INSERT INTO logs (command, created_at) VALUES ($1, NOW())", [msg]);
  });

  ws.on("close", () => {
    shell.kill();
  });
});

app.get("/logs", async (req, res) => {
  const result = await pool.query("SELECT * FROM logs ORDER BY created_at ASC");
  res.json(result.rows);
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server started on port 3000");
});
