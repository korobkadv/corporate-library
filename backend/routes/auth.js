const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../database");
const { authMiddleware } = require("../middleware/auth");
const { JWT_SECRET } = require("../config");

const router = express.Router();

// Реєстрація
router.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Всі поля обов'язкові" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashedPassword],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(400).json({ message: "Користувач вже існує" });
        }
        return res.status(500).json({ message: "Помилка сервера" });
      }

      const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, {
        expiresIn: "7d",
      });
      res.status(201).json({
        message: "Користувач створений",
        token,
        user: { id: this.lastID, username, email, role: "user" },
      });
    }
  );
});

// Вхід
router.post("/login", (req, res) => {
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
    },
  });
});

module.exports = router;
