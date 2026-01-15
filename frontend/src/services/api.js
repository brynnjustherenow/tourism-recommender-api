import axios from 'axios';
import { message } from 'antd';

// Base API configuration
const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';

// Generic error handler
const handleError = (error, defaultMessage = '操作失败') => {
  if (error.response) {
    const { status, data } = error.response;

    if (status === 401) {
      message.error('未授权，请重新登录');
    } else if (status === 403) {
      message.error('没有权限执行此操作');
    } else if (status === 404) {
      message.error('请求的资源不存在');
    } else if (status >= 500) {
      message.error('服务器错误，请稍后重试');
    } else if (data && data.error) {
      message.error(data.error);
    } else {
      message.error(defaultMessage);
    }
  } else if (error.request) {
    message.error('网络错误，请检查网络连接');
  } else {
    message.error(defaultMessage);
  }

  return Promise.reject(error);
};

// ==================== ADMIN APIs ====================

/**
 * Admin API - Recommendors
 */

// Get all recommendors (admin)
export const getAdminRecommendors = async (params = {}) => {
  try {
    const response = await axios.get('/admin/recommendors', { params });
    return response.data;
  } catch (error) {
    handleError(error, '获取推荐官列表失败');
    throw error;
  }
};

// Create recommendor (admin)
export const createRecommendor = async (data) => {
  try {
    const response = await axios.post('/admin/recommendors', data);
    message.success('创建推荐官成功');
    return response.data;
  } catch (error) {
    handleError(error, '创建推荐官失败');
    throw error;
  }
};

// Get recommendor by ID (admin)
export const getAdminRecommendorDetail = async (id) => {
  try {
    const response = await axios.get(`/admin/recommendors/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, '获取推荐官详情失败');
    throw error;
  }
};

// Update recommendor (admin)
export const updateRecommendor = async (id, data) => {
  try {
    const response = await axios.put(`/admin/recommendors/${id}`, data);
    message.success('更新推荐官成功');
    return response.data;
  } catch (error) {
    handleError(error, '更新推荐官失败');
    throw error;
  }
};

// Delete recommendor (admin)
export const deleteRecommendor = async (id) => {
  try {
    await axios.delete(`/admin/recommendors/${id}`);
    message.success('删除推荐官成功');
    return { success: true };
  } catch (error) {
    handleError(error, '删除推荐官失败');
    throw error;
  }
};

// Regenerate QR codes
export const regenerateQRCodes = async (id) => {
  try {
    const response = await axios.post(`/admin/recommendors/${id}/qrcodes`);
    message.success('二维码重新生成成功');
    return response.data;
  } catch (error) {
    handleError(error, '重新生成二维码失败');
    throw error;
  }
};

/**
 * Admin API - Destinations
 */

// Get all destinations (admin)
export const getAdminDestinations = async (params = {}) => {
  try {
    const response = await axios.get('/admin/destinations', { params });
    return response.data;
  } catch (error) {
    handleError(error, '获取目的地列表失败');
    throw error;
  }
};

// Create destination (admin)
export const createDestination = async (data) => {
  try {
    const response = await axios.post('/admin/destinations', data);
    message.success('创建目的地成功');
    return response.data;
  } catch (error) {
    handleError(error, '创建目的地失败');
    throw error;
  }
};

// Get destination by ID (admin)
export const getAdminDestinationDetail = async (id) => {
  try {
    const response = await axios.get(`/admin/destinations/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, '获取目的地详情失败');
    throw error;
  }
};

// Update destination (admin)
export const updateDestination = async (id, data) => {
  try {
    const response = await axios.put(`/admin/destinations/${id}`, data);
    message.success('更新目的地成功');
    return response.data;
  } catch (error) {
    handleError(error, '更新目的地失败');
    throw error;
  }
};

// Delete destination (admin)
export const deleteDestination = async (id) => {
  try {
    await axios.delete(`/admin/destinations/${id}`);
    message.success('删除目的地成功');
    return { success: true };
  } catch (error) {
    handleError(error, '删除目的地失败');
    throw error;
  }
};

// ==================== PUBLIC APIs ====================

/**
 * Public API - Recommendors
 */

// Get recommendors list (public)
export const getPublicRecommendors = async (params = {}) => {
  try {
    const response = await axios.get('/recommendors', { params });
    return response.data;
  } catch (error) {
    handleError(error, '获取推荐官列表失败');
    throw error;
  }
};

// Get recommendor detail (public)
export const getPublicRecommendorDetail = async (id) => {
  try {
    const response = await axios.get(`/recommendors/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, '获取推荐官详情失败');
    throw error;
  }
};

/**
 * Public API - Destinations
 */

// Get destinations list (public)
export const getPublicDestinations = async (params = {}) => {
  try {
    const response = await axios.get('/destinations', { params });
    return response.data;
  } catch (error) {
    handleError(error, '获取目的地列表失败');
    throw error;
  }
};

// Get destination detail (public)
export const getPublicDestinationDetail = async (id) => {
  try {
    const response = await axios.get(`/destinations/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, '获取目的地详情失败');
    throw error;
  }
};

// Get destinations by recommender
export const getDestinationsByRecommendor = async (recommendorId, params = {}) => {
  try {
    const response = await axios.get(`/recommendors/${recommendorId}/destinations`, { params });
    return response.data;
  } catch (error) {
    handleError(error, '获取推荐官的目的地列表失败');
    throw error;
  }
};

// ==================== REGION DATA ====================

// Load region data (provinces, cities, districts)
export const loadRegionData = async () => {
  try {
    // This could be loaded from a JSON file or API
    // For now, returning mock data - in production, load from file or API
    const response = await fetch('/data/regions.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading region data:', error);
    // Return empty structure if loading fails
    return { provinces: [] };
  }
};

export default {
  // Admin APIs
  adminRecommendors: {
    list: getAdminRecommendors,
    detail: getAdminRecommendorDetail,
    create: createRecommendor,
    update: updateRecommendor,
    delete: deleteRecommendor,
    regenerateQRCodes: regenerateQRCodes,
  },
  adminDestinations: {
    list: getAdminDestinations,
    detail: getAdminDestinationDetail,
    create: createDestination,
    update: updateDestination,
    delete: deleteDestination,
  },
  // Public APIs
  publicRecommendors: {
    list: getPublicRecommendors,
    detail: getPublicRecommendorDetail,
    destinations: getDestinationsByRecommendor,
  },
  publicDestinations: {
    list: getPublicDestinations,
    detail: getPublicDestinationDetail,
  },
  // Region data
  regions: {
    load: loadRegionData,
  },
};
