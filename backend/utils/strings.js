function decodeToUtf8IfNeeded(name) {
  if (!name) return name;
  if (/[ÃÂÐÑ]/.test(name)) {
    try {
      return Buffer.from(name, "latin1").toString("utf8");
    } catch (e) {
      return name;
    }
  }
  return name;
}

module.exports = { decodeToUtf8IfNeeded };
