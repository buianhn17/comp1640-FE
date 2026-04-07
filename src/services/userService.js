import apiClient from "./apiClient";

export const getUsers = async (params) => {
  const config = params ? { params } : undefined;
  const response = await apiClient.get("/users", config);
  return response.data;
};

export const getUserById = async (id) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (payload) => {
  const response = await apiClient.post("/users", payload);
  return response.data;
};

export const updateUser = async (id, payload) => {
  const response = await apiClient.put(`/users/${id}`, payload);
  return response.data;
};

export const toggleUserActive = async (id) => {
  const response = await apiClient.patch(`/users/${id}/toggle-active`);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
};