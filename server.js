const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("command", (cmd) => {
    const shell = spawn(cmd, { shell: true });
    shell.stdout.on("data", (data) => {
      socket.emit("output", data.toString());
    });
    shell.stderr.on("data", (data) => {
      socket.emit("output", data.toString());
    });
    shell.on("close", (code) => {
      socket.emit("output", `\n[Process exited with code ${code}]\n`);
    });
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
