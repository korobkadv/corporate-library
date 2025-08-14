const express = require("express");
const { db } = require("../database");
const { authMiddleware, requireRoles } = require("../middleware/auth");

const router = express.Router();

// Публічне отримання налаштувань
router.get("/", (req, res) => {
  db.all("SELECT key, value FROM settings", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Помилка сервера" });
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.json({ settings });
  });
});

// Оновлення налаштувань (editor, admin)
router.put("/", authMiddleware, requireRoles("editor", "admin"), (req, res) => {
  const updates = req.body || {};
  const entries = Object.entries(updates);
  if (entries.length === 0) return res.json({ message: "Нема що оновлювати" });
  const stmt = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  );
  try {
    for (const [key, value] of entries) {
      stmt.run(key, String(value));
    }
    stmt.finalize();
    res.json({ message: "Налаштування збережено" });
  } catch (e) {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

module.exports = router;
