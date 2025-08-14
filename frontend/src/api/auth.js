import axios from "axios";
import { API_BASE } from "../config";

export async function loginRequest(email, password) {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return res.data;
}

export async function registerRequest(username, email, password) {
  const res = await axios.post(`${API_BASE}/auth/register`, {
    username,
    email,
    password,
  });
  return res.data;
}

export async function profileRequest() {
  const res = await axios.get(`${API_BASE}/auth/profile`);
  return res.data;
}
