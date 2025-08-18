const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../database");
const nodemailer = require("nodemailer");
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = require("../config");
const { authMiddleware } = require("../middleware/auth");
const { JWT_SECRET } = require("../config");

const router = express.Router();
// застосовуємо суворіший ліміт лише для логіну (встановлений у server.js)
const rateLimit = require("express-rate-limit");
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Забагато спроб входу, спробуйте пізніше" },
});

// Транспортер email (опційно)
const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

// Реєстрація
router.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Всі поля обов'язкові" });
  }

  // Валідація пароля: >=7 символів, щонайменше одна цифра і одна велика літера
  const strong = /^(?=.*[A-Z])(?=.*\d).{7,}$/;
  if (!strong.test(password)) {
    return res.status(400).json({
      message:
        "Пароль має містити мінімум 7 символів, принаймні одну цифру і одну велику літеру",
    });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  // Генеруємо код верифікації email
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

  db.run(
    "INSERT INTO users (username, email, password, verification_code) VALUES (?, ?, ?, ?)",
    [username, email, hashedPassword, verificationCode],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(400).json({ message: "Користувач вже існує" });
        }
        return res.status(500).json({ message: "Помилка сервера" });
      }

      // Надсилаємо код верифікації (якщо налаштований SMTP)
      if (transporter) {
        transporter
          .sendMail({
            from: SMTP_FROM,
            to: email,
            subject: "Підтвердження email",
            text: `Ваш код підтвердження: ${verificationCode}`,
          })
          .catch(() => {});
      }

      res.status(201).json({
        message:
          "Користувача створено. Перевірте email для підтвердження та дочекайтесь активації адміном.",
      });
    }
  );
});

// Вхід
router.post("/login", loginLimiter, (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Помилка сервера" });
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: "Невірні дані" });
    }

    if (user.status !== "active") {
      return res
        .status(403)
        .json({ message: "Обліковий запис не активований" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  });
});

// Отримання профілю
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      email_verified_at: req.user.email_verified_at || null,
    },
  });
});

// Підтвердження email
router.post("/verify-email", (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ message: "Невірні дані" });
  db.get(
    "SELECT id, verification_code FROM users WHERE email = ?",
    [email],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Помилка сервера" });
      if (!row || row.verification_code !== String(code))
        return res.status(400).json({ message: "Невірний код" });

      db.run(
        "UPDATE users SET email_verified_at = CURRENT_TIMESTAMP, verification_code = NULL WHERE id = ?",
        [row.id],
        (e2) => {
          if (e2) return res.status(500).json({ message: "Помилка сервера" });
          res.json({ message: "Email підтверджено" });
        }
      );
    }
  );
});

module.exports = router;
