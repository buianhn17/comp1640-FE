import apiClient from './apiClient';

/**
 * LƯU Ý CHO AN: 
 * Mình đã xóa bỏ hàm filterIdeasByRole vì nó chính là nguyên nhân 
 * chặn đứng các Idea không thuộc Department của Manager.
 * Giờ đây API trả về cái gì, Frontend sẽ hiển thị toàn bộ cái đó.
 */

// 1. Submit a new idea
export const submitIdea = async (payload) => {
  const response = await apiClient.post('/ideas', payload);
  return response.data;
};

// 2. Get all ideas (Dùng cho filter "All Ideas")
export const getAllIdeas = async (params = {}) => {
  // Params thường chứa { page, size, deptId... }
  const response = await apiClient.get('/ideas', { params });
  return response.data; 
};

// 3. Get most popular ideas
export const getMostPopularIdeas = async (page = 0, size = 5) => {
  const response = await apiClient.get('/ideas/most-popular', {
    params: { page, size }
  });
  return response.data;
};

// 4. Get latest ideas
export const getLatestIdeas = async (page = 0, size = 5) => {
  const response = await apiClient.get('/ideas/latest', {
    params: { page, size }
  });
  return response.data;
};

// 5. Get idea by ID
export const getIdeaById = async (id) => {
  const response = await apiClient.get(`/ideas/${id}`);
  return response.data;
};

// 6. Like/Dislike hoặc các hành động khác (nếu bạn có)
export const voteIdea = async (ideaId, voteType) => {
  const response = await apiClient.post(`/ideas/${ideaId}/vote`, { type: voteType });
  return response.data;
};