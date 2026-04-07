import apiClient from './apiClient';

// Get all categories
export const getCategories = async () => {
  const response = await apiClient.get('/categories');
  return response.data;
};

// Get category by ID
export const getCategoryById = async (id) => {
  const response = await apiClient.get(`/categories/${id}`);
  return response.data;
};

// Create new category (ADMIN and QA_MGR only)
export const createCategory = async (payload) => {
  const response = await apiClient.post('/categories', payload);
  return response.data;
};

// Update category (ADMIN and QA_MGR only)
export const updateCategory = async (id, payload) => {
  const response = await apiClient.put(`/categories/${id}`, payload);
  return response.data;
};

// Delete category (ADMIN and QA_MGR only)
export const deleteCategory = async (id) => {
  const response = await apiClient.delete(`/categories/${id}`);
  return response.data;
};
