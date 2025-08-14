import axios from "axios";
import { API_BASE } from "../config";

export async function getSettings() {
  const res = await axios.get(`${API_BASE}/settings`);
  return res.data.settings || {};
}

export async function updateSettings(updates) {
  const res = await axios.put(`${API_BASE}/settings`, updates);
  return res.data;
}
