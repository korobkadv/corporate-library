const jwt = require("jsonwebtoken");
const { db } = require("../database");
const { JWT_SECRET } = require("../config");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Токен не надано" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    db.get(
      "SELECT * FROM users WHERE id = ?",
      [decoded.userId],
      (err, user) => {
        if (err || !user) {
          return res.status(401).json({ message: "Недійсний токен" });
        }

        req.user = user;
        next();
      }
    );
  } catch (error) {
    res.status(401).json({ message: "Недійсний токен" });
  }
};

const requireRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ заборонено" });
    }
    next();
  };

module.exports = {
  authMiddleware,
  adminMiddleware: requireRoles("admin"),
  requireRoles,
  JWT_SECRET,
};
