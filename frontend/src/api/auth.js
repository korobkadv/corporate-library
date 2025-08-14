import apiClient from "./client";

export async function loginRequest(email, password) {
  const res = await apiClient.post(`/auth/login`, { email, password });
  return res.data;
}

export async function registerRequest(username, email, password) {
  const res = await apiClient.post(`/auth/register`, {
    username,
    email,
    password,
  });
  return res.data;
}

export async function profileRequest() {
  const res = await apiClient.get(`/auth/profile`);
  return res.data;
}
