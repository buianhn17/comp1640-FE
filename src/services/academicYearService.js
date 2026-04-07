import apiClient from "./apiClient";

export const getAcademicYears = async () => {
  const response = await apiClient.get("/academic-years");
  return response.data;
};

export const getAcademicYearById = async (id) => {
  const response = await apiClient.get(`/academic-years/${id}`);
  return response.data;
};

export const getCurrentAcademicYear = async () => {
  const response = await apiClient.get("/academic-years/current");
  return response.data;
};

export const createAcademicYear = async (payload) => {
  const response = await apiClient.post("/academic-years", payload);
  return response.data;
};

export const updateAcademicYear = async (id, payload) => {
  const response = await apiClient.put(`/academic-years/${id}`, payload);
  return response.data;
};

export const deleteAcademicYear = async (id) => {
  const response = await apiClient.delete(`/academic-years/${id}`);
  return response.data;
};