import apiClient from './apiClient';

// Add comment to an idea
export const addComment = async (ideaId, payload) => {
  const response = await apiClient.post(`/ideas/${ideaId}/comments`, payload);
  return response.data;
};

// Get all comments for an idea
export const getCommentsByIdea = async (ideaId) => {
  const response = await apiClient.get(`/ideas/${ideaId}/comments`);
  return response.data;
};

// Get latest comments across all ideas (paginated)
export const getLatestComments = async (page = 0, size = 10) => {
  const response = await apiClient.get('/comments/latest', {
    params: { page, size }
  });
  return response.data;
};

// Update a comment
export const updateComment = async (commentId, payload) => {
  const response = await apiClient.put(`/comments/${commentId}`, payload);
  return response.data;
};

// Delete a comment
export const deleteComment = async (commentId) => {
  const response = await apiClient.delete(`/comments/${commentId}`);
  return response.data;
};
