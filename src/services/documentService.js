import apiClient from './apiClient';

// Upload document/file attachment for an idea
export const uploadDocument = async (ideaId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post(
    `/ideas/${ideaId}/documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }
  );
  return response.data;
};

// Get all documents for an idea
export const getDocumentsByIdea = async (ideaId) => {
  const response = await apiClient.get(`/ideas/${ideaId}/documents`);
  return response.data;
};

// Delete a document
export const deleteDocument = async (ideaId, documentId) => {
  const response = await apiClient.delete(`/ideas/${ideaId}/documents/${documentId}`);
  return response.data;
};
