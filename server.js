const express = require("express");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, "public")));

const users = {}; // socket.id -> username
const rooms = {}; // room -> [usernames]

io.on("connection", (socket) => {
  console.log("👤 A user connected");

  socket.on("joinRoom", ({ username, room }) => {
    const nameExists = Object.values(users).includes(username);
    if (nameExists) {
      socket.emit("usernameError", "Username already taken");
      return;
    }

    users[socket.id] = username;
    socket.join(room);
    socket.username = username;
    socket.room = room;

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(username);

    socket.emit("joinedRoom");
    socket.to(room).emit("update", `🟢 ${username} joined the room at ${new Date().toLocaleTimeString()}`);
  });

  socket.on("chat", (text) => {
    const message = {
      username: users[socket.id],
      text,
      time: new Date().toLocaleTimeString()
    };
    socket.to(socket.room).emit("chat", message);
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];
    const room = socket.room;

    if (username && room) {
      socket.to(room).emit("update", `🔴 ${username} left the room at ${new Date().toLocaleTimeString()}`);
      delete users[socket.id];
      rooms[room] = rooms[room].filter(name => name !== username);
    }
  });
});

const PORT = 5002;
server.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});