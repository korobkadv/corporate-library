import apiClient from "./client";

export async function listUsers() {
  const res = await apiClient.get(`/users`);
  return res.data.users || [];
}

export async function updateUserRole(id, role) {
  const res = await apiClient.put(`/users/${id}/role`, { role });
  return res.data;
}

export async function updateUserStatus(id, status) {
  const res = await apiClient.put(`/users/${id}/status`, { status });
  return res.data;
}

export async function deleteUser(id) {
  const res = await apiClient.delete(`/users/${id}`);
  return res.data;
}
