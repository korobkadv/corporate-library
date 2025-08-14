import axios from "axios";
import { API_BASE } from "../config";

export async function listDocuments(params) {
  const res = await axios.get(`${API_BASE}/documents`, { params });
  return res.data;
}

export async function uploadDocument(formData) {
  const res = await axios.post(`${API_BASE}/documents/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateDocument(id, data) {
  const res = await axios.put(`${API_BASE}/documents/${id}`, data);
  return res.data;
}

export async function deleteDocument(id) {
  const res = await axios.delete(`${API_BASE}/documents/${id}`);
  return res.data;
}

export async function downloadDocument(id) {
  const res = await axios.get(`${API_BASE}/documents/download/${id}`, {
    responseType: "blob",
  });
  return res.data;
}
