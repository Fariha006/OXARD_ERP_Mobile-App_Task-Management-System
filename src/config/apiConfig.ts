// API Configuration
export const API_CONFIG = {
  // Base URL for API endpoints
   // BASE_URL: 'http://216.48.184.187:8081',
  //  BASE_URL: 'http://157.175.202.101:8050/apimobile',

 //VISAT
 // BASE_URL:'http://216.48.184.187:8050/apimobile', 
 BASE_URL:'http://216.48.184.187:8083', 
  
  // API endpoints
  ENDPOINTS: {
    LOGIN: '/api/Login/CheckAuthentication',
    // Add other endpoints here as needed
  },
  
  // Timeout settings
  TIMEOUT: 10000, // 10 seconds
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  BLOB_HEADERS: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  
  // File upload paths
  UPLOAD_PATHS: {
    DOCUMENTS: '/UploadFiles/DocManager/Attachments/',
    // Add other upload paths as needed
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get full file URL
export const getFileUrl = (filePath: string): string => {
  return `${API_CONFIG.BASE_URL}${filePath}`;
};

// Environment-specific configurations
export const ENV_CONFIG = {
  development: {
    ...API_CONFIG,
    // Add development-specific settings
  },
  production: {
    ...API_CONFIG,
    // Add production-specific settings
  },
  staging: {
    ...API_CONFIG,
    // Add staging-specific settings
  }
};

// Get current environment configuration
export const getCurrentConfig = () => {
  // You can add logic here to determine the current environment
  // For now, using the default configuration
  return API_CONFIG;
}; 