// Environment configuration
export const config = {
  // Backend URL based on environment
  BACKEND_URL: (() => {
    // Check if we're in development
    if (import.meta.env.DEV) {
      return 'http://localhost:8080';
    }
    
    // In production, use environment variable or default Railway URL
    if (import.meta.env.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL;
    }
    
    // Fallback to Railway auto-generated URL pattern
    // Railway usually provides this via PUBLIC_URL or similar
    if (import.meta.env.VITE_RAILWAY_URL) {
      return import.meta.env.VITE_RAILWAY_URL;
    }
    
    // Final fallback - will need to be updated with actual Railway URL
    return 'https://your-backend.railway.app';
  })(),
  
  // API endpoints
  API_ENDPOINTS: {
    HEALTH: '/health',
    SEPARATE: '/separate',
    STEMS: '/stems',
    ORIGINAL_AUDIO: '/original_audio'
  },
  
  // File upload limits
  MAX_FILE_SIZE: 200 * 1024 * 1024, // 200MB
  
  // Supported file types
  SUPPORTED_FORMATS: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
  
  // Environment info
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV
};

// Helper functions
export const getApiUrl = (endpoint: string) => {
  return `${config.BACKEND_URL}${endpoint}`;
};

export const getStemUrl = (stemPath: string) => {
  return `${config.BACKEND_URL}/stems/${stemPath}`;
};

export const getOriginalAudioUrl = (audioPath: string) => {
  return `${config.BACKEND_URL}/original_audio/${audioPath}`;
};

// Debug info (only in development)
if (config.IS_DEVELOPMENT) {
  console.log('🔧 Environment Config:', {
    BACKEND_URL: config.BACKEND_URL,
    IS_PRODUCTION: config.IS_PRODUCTION,
    ENV_VARS: {
      VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
      VITE_RAILWAY_URL: import.meta.env.VITE_RAILWAY_URL
    }
  });
} 