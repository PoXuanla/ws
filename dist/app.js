"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const socket_io_1 = require("socket.io");
const socketHandlers_1 = require("./socketHandlers");
function createSocketServer() {
    const app = express();
    const httpServer = createServer(app);
    const io = new socket_io_1.Server(httpServer, {
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
    const userRooms = new Map();
    const roomsMsgs = new Map();
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
    (0, socketHandlers_1.setupSocketEvents)(io, userRooms, roomsMsgs);
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
