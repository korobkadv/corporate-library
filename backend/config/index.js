const path = require("path");

const PORT = process.env.PORT || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

module.exports = {
  PORT,
  JWT_SECRET,
  UPLOADS_DIR,
};
