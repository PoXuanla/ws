const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const socket_io_1 = require("socket.io");
import type { Server, Socket } from "socket.io";

import { setupSocketEvents } from "./socketHandlers";
import { UserRooms, RoomsMsgs } from "./types/socket";

function createSocketServer() {
  const app = express();
  const httpServer = createServer(app);
  const io: Server = new socket_io_1.Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  const userRooms: UserRooms = new Map();
  const roomsMsgs: RoomsMsgs = new Map();

  const setupMiddlewares = () => {
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  };

  const setupRoutes = () => {
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
  };

  const setupErrorHandler = () => {
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).send("Something broke!");
    });
  };

  setupMiddlewares();
  setupRoutes();
  setupSocketEvents(io, userRooms, roomsMsgs);
  setupErrorHandler();

  return {
    app,
    httpServer,
  };
}

const { app, httpServer } = createSocketServer();
module.exports = {
  app,
  httpServer,
};
