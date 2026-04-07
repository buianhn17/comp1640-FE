import apiClient from './apiClient';

// Submit a new idea
export const submitIdea = async (payload) => {
  const response = await apiClient.post('/ideas', payload);
  return response.data;
};

// Get all ideas with optional filtering and pagination
export const getAllIdeas = async (params = {}) => {
  const config = params ? { params } : undefined;
  const response = await apiClient.get('/ideas', config);
  return response.data;
};

// Get most popular ideas (paginated)
export const getMostPopularIdeas = async (page = 0, size = 5) => {
  const response = await apiClient.get('/ideas/most-popular', {
    params: { page, size }
  });
  return response.data;
};

// Get latest ideas (paginated)
export const getLatestIdeas = async (page = 0, size = 5) => {
  const response = await apiClient.get('/ideas/latest', {
    params: { page, size }
  });
  return response.data;
};

// Get most viewed ideas by academic year
export const getMostViewedIdeas = async (yearId) => {
  const response = await apiClient.get('/ideas/most-viewed', {
    params: { yearId }
  });
  return response.data;
};

// Get idea by ID (increments view count)
export const getIdeaById = async (id) => {
  const response = await apiClient.get(`/ideas/${id}`);
  return response.data;
};

// Update idea
export const updateIdea = async (id, payload) => {
  const response = await apiClient.put(`/ideas/${id}`, payload);
  return response.data;
};

// Delete idea
export const deleteIdea = async (id) => {
  const response = await apiClient.delete(`/ideas/${id}`);
  return response.data;
};
