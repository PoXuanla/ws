const { app, httpServer } = require("./app");
import config from "./config/config";

httpServer.listen(config.port, () => {
  console.log(`服務器運行在 http://localhost:${config.port}`);
  console.log("環境:", config.nodeEnv);
});
