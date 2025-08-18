const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs-extra");
const { PORT, UPLOADS_DIR } = require("./config");

const app = express();

// Middleware
app.use(helmet());
// Обмежуємо CORS для відомих origins
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Загальний rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 100, // 100 запитів на IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Суворіший ліміт на логін
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Забагато спроб входу, спробуйте пізніше" },
});

// Створення папок для завантажень
fs.ensureDirSync(UPLOADS_DIR);

// Ініціалізація бази даних (окремий модуль усуває циклічні імпорти)
require("./database");

// Роути
app.use("/api/auth", require("./routes/auth"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/users", require("./routes/users"));
app.use("/api/settings", require("./routes/settings"));

// Статичні файли для завантажених документів (публічно)
// Для зменшення ризиків XSS віддаємо SVG як octet-stream через опцію setHeaders
app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.toLowerCase().endsWith(".svg")) {
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Disposition", "attachment");
      }
    },
  })
);

// Для production - обслуговування React додатку
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
