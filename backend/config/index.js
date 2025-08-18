const path = require("path");
require("dotenv").config();

const PORT = parseInt(process.env.PORT || "5000", 10);
const JWT_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && !JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production environment");
}
// Для розробки допускаємо дефолт, але логгуємо попередження
const EFFECTIVE_JWT_SECRET = JWT_SECRET || "dev-insecure-secret-change-me";
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "..", "uploads");
const NEWS_UPLOADS_DIR = process.env.NEWS_UPLOADS_DIR
  ? path.resolve(process.env.NEWS_UPLOADS_DIR)
  : path.join(UPLOADS_DIR, "news");

module.exports = {
  PORT,
  JWT_SECRET: EFFECTIVE_JWT_SECRET,
  UPLOADS_DIR,
  NEWS_UPLOADS_DIR,
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "no-reply@example.com",
};
