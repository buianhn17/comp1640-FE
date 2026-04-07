import apiClient from "./apiClient";

export const getDepartments = async () => {
  const response = await apiClient.get("/departments");
  return response.data;
};

export const getDepartmentById = async (id) => {
  const response = await apiClient.get(`/departments/${id}`);
  return response.data;
};

export const createDepartment = async (payload) => {
  const response = await apiClient.post("/departments", payload);
  return response.data;
};

export const updateDepartment = async (id, payload) => {
  const response = await apiClient.put(`/departments/${id}`, payload);
  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await apiClient.delete(`/departments/${id}`);
  return response.data;
};