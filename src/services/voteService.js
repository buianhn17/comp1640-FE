import apiClient from './apiClient';

// Vote on an idea
export const voteOnIdea = async (ideaId, payload) => {
  const response = await apiClient.post(`/ideas/${ideaId}/vote`, payload);
  return response.data;
};

// Get vote information for an idea
export const getIdeaVotes = async (ideaId) => {
  const response = await apiClient.get(`/ideas/${ideaId}/vote`);
  return response.data;
};

// Delete vote on an idea
export const deleteVote = async (ideaId) => {
  const response = await apiClient.delete(`/ideas/${ideaId}/vote`);
  return response.data;
};
