import apiClient from "./client";

export async function listNews(params) {
  const res = await apiClient.get(`/news`, { params });
  return res.data;
}

export async function getNews(id) {
  const res = await apiClient.get(`/news/${id}`);
  return res.data.news;
}

export async function createNews(formData) {
  const res = await apiClient.post(`/news`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateNews(id, formData) {
  const res = await apiClient.put(`/news/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteNews(id) {
  const res = await apiClient.delete(`/news/${id}`);
  return res.data;
}

// Admin endpoints
export async function listNewsAdmin(params) {
  const res = await apiClient.get(`/news/manage`, { params });
  return res.data;
}

export async function getNewsAdmin(id) {
  const res = await apiClient.get(`/news/manage/${id}`);
  return res.data.news;
}

// Comments
export async function listComments(newsId) {
  const res = await apiClient.get(`/news-comments/${newsId}`);
  return res.data.comments || [];
}

export async function createComment(newsId, content) {
  const res = await apiClient.post(`/news-comments/${newsId}`, { content });
  return res.data;
}

export async function deleteComment(commentId) {
  const res = await apiClient.delete(`/news-comments/${commentId}`);
  return res.data;
}
