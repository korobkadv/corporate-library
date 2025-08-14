import apiClient from "./client";

export async function listDocuments(params) {
  const res = await apiClient.get(`/documents`, { params });
  return res.data;
}

export async function uploadDocument(formData) {
  const res = await apiClient.post(`/documents/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateDocument(id, data) {
  const res = await apiClient.put(`/documents/${id}`, data);
  return res.data;
}

export async function deleteDocument(id) {
  const res = await apiClient.delete(`/documents/${id}`);
  return res.data;
}

export async function downloadDocument(id) {
  const res = await apiClient.get(`/documents/download/${id}`, {
    responseType: "blob",
  });
  return res.data;
}
