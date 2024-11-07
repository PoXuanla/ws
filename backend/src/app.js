const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const config = require("./config/config");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  // 添加重連配置
  connectionStateRecovery: {
    // 最大重連時間（毫秒）
    maxDisconnectionDuration: 2 * 60 * 1000,
    // 跳過中間件
    skipMiddlewares: true,
  },
});

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 基本路由
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const userRooms = new Map();
const sessions = new Map();

// io.use((socket, next) => {
//   const clientId = socket.handshake.auth.clientId;

//   if (clientId) {
//     // 恢復之前的會話
//     const sessionInfo = sessions.get(clientId);
//     if (sessionInfo) {
//       socket.id = clientId; // 使用原來的 ID
//       socket.rooms = new Set(sessionInfo.rooms); // 恢復房間信息
//     }
//   }

//   next();
// });

// Socket.IO 事件處理
io.on("connection", (socket) => {
  console.log("用戶已連接:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
    userRooms.set(socket.id, room);
    console.log(`用戶 ${socket.id} 加入房間 ${room}`);
    // 保存用戶的房間信息
    sessions.set(socket.id, {
      rooms: Array.from(socket.rooms),
    });
  });

  // 斷線重連處理
  socket.on("reconnect", (attemptNumber) => {
    console.log(`用戶 ${socket.id} 重連成功，嘗試次數: ${attemptNumber}`);
    // 恢復用戶的房間
    const previousRoom = userRooms.get(socket.id);
    if (previousRoom) {
      socket.join(previousRoom);
      console.log(`用戶 ${socket.id} 重新加入房間 ${previousRoom}`);
    }
  });

  socket.on("send_message", (data) => {
    console.log("data", data);
    io.to(data.room).emit("receive_message", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    console.log("用戶已斷開連接:", socket.id);
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

module.exports = { app, httpServer };
