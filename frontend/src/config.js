// У dev завжди використовуємо відносний шлях, щоб CRA-проксі у dev зняв CORS,
// у проді допускаємо явну REACT_APP_API_URL або відносний /api
export const API_BASE =
  process.env.NODE_ENV !== "production"
    ? "/api"
    : process.env.REACT_APP_API_URL || "/api";

export const getServerBase = () => API_BASE.replace(/\/api\/?$/, "");

export const buildFileUrl = (filename) =>
  `${getServerBase()}/uploads/${filename}`;

export const buildNewsFileUrl = (filename) =>
  `${getServerBase()}/news-uploads/${filename}`;
