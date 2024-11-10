const { Server } = require("socket.io");

const io = new Server(13000, {
  cors: {
    origin: ["http://127.0.0.1:3000", "http://localhost:3000"],
  },
});

io.on("connection", (socket) => {
  socket.emit("$CurrentStatus", { status: "NULL" });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("$EnterRoom", (msg) => {
    console.log(msg);
  });
});

console.log("Socket.IO server running on port 13000");
