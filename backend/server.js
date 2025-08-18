const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs-extra");
const { PORT, UPLOADS_DIR, NEWS_UPLOADS_DIR } = require("./config");

const app = express();

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
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
fs.ensureDirSync(NEWS_UPLOADS_DIR);

// Ініціалізація бази даних (окремий модуль усуває циклічні імпорти)
require("./database");

// Роути
app.use("/api/auth", require("./routes/auth"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/users", require("./routes/users"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/news", require("./routes/news"));
app.use("/api/news-comments", require("./routes/newsComments"));

// Статичні файли для завантажених документів (публічно)
// Для зменшення ризиків XSS віддаємо SVG як octet-stream через опцію setHeaders
// Додаємо CORP і COEP, та окремі директиви для SVG
const staticSetHeaders = (res, filePath) => {
  // disable sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (filePath.toLowerCase().endsWith(".svg")) {
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "attachment");
  }
};

app.use(
  "/uploads",
  express.static(UPLOADS_DIR, { setHeaders: staticSetHeaders })
);
app.use(
  "/news-uploads",
  express.static(NEWS_UPLOADS_DIR, { setHeaders: staticSetHeaders })
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
