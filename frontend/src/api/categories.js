import axios from "axios";
import { API_BASE } from "../config";

export async function listCategories() {
  const res = await axios.get(`${API_BASE}/categories`);
  return res.data.categories || [];
}

export async function createCategory(data) {
  const res = await axios.post(`${API_BASE}/categories`, data);
  return res.data;
}

export async function updateCategory(id, data) {
  const res = await axios.put(`${API_BASE}/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(id) {
  const res = await axios.delete(`${API_BASE}/categories/${id}`);
  return res.data;
}
