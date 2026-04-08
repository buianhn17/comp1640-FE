import apiClient from './apiClient';

// Get statistics report for academic year
export const getStatisticsReport = async (yearId, deptId = null) => {
    try {
        const params = new URLSearchParams();
        if (yearId) params.append('yearId', yearId);
        if (deptId) params.append('deptId', deptId);
        const response = await apiClient.get(`/reports/statistics?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching statistics report:', error);
        throw error;
    }
};

// Get comprehensive statistics for dashboard
export const getComprehensiveStatistics = async (yearId, deptId = null) => {
    try {
        const params = new URLSearchParams();
        if (yearId) params.append('yearId', yearId);
        if (deptId) params.append('deptId', deptId);
        const response = await apiClient.get(`/reports/statistics/comprehensive?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching comprehensive statistics:', error);
        throw error;
    }
};

// Get ideas without comments
export const getIdeasWithoutComments = async (yearId) => {
    try {
        const params = new URLSearchParams();
        if (yearId) params.append('yearId', yearId);
        const response = await apiClient.get(`/reports/no-comments?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching ideas without comments:', error);
        throw error;
    }
};

// Get anonymous content (ideas and comments)
export const getAnonymousContent = async (yearId) => {
    try {
        const params = new URLSearchParams();
        if (yearId) params.append('yearId', yearId);
        const response = await apiClient.get(`/reports/anonymous-content?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching anonymous content:', error);
        throw error;
    }
};

// Export ideas and comments to CSV
export const exportToCSV = async (yearId) => {
    try {
        const params = new URLSearchParams();
        if (yearId) params.append('yearId', yearId);
        const response = await apiClient.get(`/reports/export/csv?${params}`, {
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ideas_comments_${yearId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        throw error;
    }
};

// Export attachments as ZIP
export const exportAttachmentsAsZip = async (yearId) => {
    try {
        const params = new URLSearchParams();
        if (yearId) params.append('yearId', yearId);
        const response = await apiClient.get(`/reports/export/attachments-zip?${params}`, {
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `attachments_${yearId}.zip`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting attachments as ZIP:', error);
        throw error;
    }
};
