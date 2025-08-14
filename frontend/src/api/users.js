import axios from "axios";
import { API_BASE } from "../config";

export async function listUsers() {
  const res = await axios.get(`${API_BASE}/users`);
  return res.data.users || [];
}

export async function updateUserRole(id, role) {
  const res = await axios.put(`${API_BASE}/users/${id}/role`, { role });
  return res.data;
}

export async function updateUserStatus(id, status) {
  const res = await axios.put(`${API_BASE}/users/${id}/status`, { status });
  return res.data;
}

export async function deleteUser(id) {
  const res = await axios.delete(`${API_BASE}/users/${id}`);
  return res.data;
}
