import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
// import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // Тимчасово без StrictMode, щоб уникнути попереджень findDOMNode від ReactQuill у dev
  <App />
);

// Web Vitals вимкнено за замовчуванням; увімкніть за потреби
