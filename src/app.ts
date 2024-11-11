const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
import config from "./config/config";
import { Server, Socket } from "socket.io";

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

const roomsMsgs = new Map<string, Array<{ room: string, content: string, user: string }>>();

// 獲取指定房間的人數
function getRoomUserCount(roomName: string): number {
  return io.sockets.adapter.rooms.get(roomName)?.size || 0;
}




// Socket.IO 事件處理
io.on("connection", (socket: Socket) => {

  const clientId = socket.handshake.auth.clientId;

  if (userRooms.has(clientId)) {
    const previousRoom = userRooms.get(clientId);
    socket.join(previousRoom);
    console.log(`用戶 ${clientId} 重新加入房間 ${previousRoom}`);

    // io.to(previousRoom).emit('comeback', roomsMsgs[previousRoom]);

    io.to(previousRoom).emit('receive_message', {
      user: clientId,
      room:previousRoom,
      content: `${clientId} 回到 ${previousRoom} 房間`,
    });

  
  }

  console.log("Default room:", io.sockets.adapter.rooms);


  socket.on("join_room", (room: string) => {
    socket.join(room);

    userRooms.set(clientId, room);

    console.log(`用戶 ${socket.id} 加入房間 ${room}`);


    console.log("Default room2:", io.sockets.adapter.rooms);



    // 向房間內的所有用戶廣播當前房間人數
    const userCount = getRoomUserCount(room)
    io.to(room).emit('roomUserCount', userCount);
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

  socket.on("send_message", (data: { room: string, content: string, user: string }) => {
    console.log("data", data);
    io.to(data.room).emit("receive_message", {
      ...data,
      user:clientId,
      timestamp: new Date().toISOString(),
    });

    if (roomsMsgs.has(data.room)) {
      roomsMsgs.set(data.room, [...roomsMsgs.get(data.room), data]);
    } else {
      roomsMsgs.set(data.room, [data]);
    }
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
