const express = require("express");
const { spawn } = require("child_process");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  const bash = spawn("bash");

  bash.stdout.on("data", (data) => {
    socket.emit("output", data.toString());
  });

  bash.stderr.on("data", (data) => {
    socket.emit("output", data.toString());
  });

  socket.on("input", (input) => {
    bash.stdin.write(input + "\n");
  });

  socket.on("disconnect", () => {
    bash.kill();
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port", process.env.PORT || 3000);
});
