require("dotenv").config();


export default {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5500",
};
