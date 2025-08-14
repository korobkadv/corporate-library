import apiClient from "./client";

export async function listCategories() {
  const res = await apiClient.get(`/categories`);
  return res.data.categories || [];
}

export async function createCategory(data) {
  const res = await apiClient.post(`/categories`, data);
  return res.data;
}

export async function updateCategory(id, data) {
  const res = await apiClient.put(`/categories/${id}`, data);
  return res.data;
}

export async function deleteCategory(id) {
  const res = await apiClient.delete(`/categories/${id}`);
  return res.data;
}
