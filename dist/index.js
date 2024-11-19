"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { app, httpServer } = require("./app");
const config_1 = __importDefault(require("./config/config"));
httpServer.listen(config_1.default.port, () => {
    console.log(`服務器運行在 http://localhost:${config_1.default.port}`);
    console.log("環境:", config_1.default.nodeEnv);
});
