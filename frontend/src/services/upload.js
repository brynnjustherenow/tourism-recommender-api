import axios from 'axios';
import { message } from 'antd';

// Base API configuration
const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';

/**
 * Generic file upload handler
 * @param {File} file - The file to upload
 * @param {string} endpoint - The upload endpoint
 * @param {string} fieldName - The form field name (default: 'file')
 * @returns {Promise<Object>} - Upload result
 */
const uploadFile = async (file, endpoint, fieldName = 'file') => {
  try {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    message.success('文件上传成功');
    return response.data.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      '文件上传失败';
    message.error(errorMessage);
    throw error;
  }
};

/**
 * Upload avatar image
 * @param {File} file - The avatar image file (max 2MB, jpg/png/gif/webp)
 * @returns {Promise<Object>} - Upload result with file URL
 */
export const uploadAvatar = async (file) => {
  return uploadFile(file, '/v1/upload/avatar', 'file');
};

/**
 * Upload image
 * @param {File} file - The image file (max 10MB, jpg/png/gif/webp)
 * @returns {Promise<Object>} - Upload result with file URL
 */
export const uploadImage = async (file) => {
  return uploadFile(file, '/v1/upload/image', 'file');
};

/**
 * Upload document
 * @param {File} file - The document file (max 10MB)
 * @returns {Promise<Object>} - Upload result with file URL
 */
export const uploadDocument = async (file) => {
  return uploadFile(file, '/v1/upload/document', 'file');
};

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum file size in MB (default: 2)
 * @returns {boolean} - True if file is valid
 */
export const validateImageFile = (file, maxSizeMB = 2) => {
  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    message.error(`文件大小不能超过 ${maxSizeMB}MB`);
    return false;
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    message.error('只支持 JPG、PNG、GIF、WebP 格式的图片');
    return false;
  }

  return true;
};

/**
 * Convert file to base64 (for preview)
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Get file extension
 * @param {string} filename - The file name
 * @returns {string} - File extension (without dot)
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export default {
  avatar: uploadAvatar,
  image: uploadImage,
  document: uploadDocument,
  validate: validateImageFile,
  toBase64: fileToBase64,
  formatSize: formatFileSize,
  getExtension: getFileExtension,
};
