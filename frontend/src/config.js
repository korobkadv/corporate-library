export const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const getServerBase = () => API_BASE.replace(/\/api\/?$/, "");

export const buildFileUrl = (filename) =>
  `${getServerBase()}/uploads/${filename}`;
