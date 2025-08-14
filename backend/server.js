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
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

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
app.use("/uploads", express.static(UPLOADS_DIR));

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
