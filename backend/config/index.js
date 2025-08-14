const path = require("path");
require("dotenv").config();

const PORT = parseInt(process.env.PORT || "5000", 10);
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "..", "uploads");

module.exports = {
  PORT,
  JWT_SECRET,
  UPLOADS_DIR,
};
