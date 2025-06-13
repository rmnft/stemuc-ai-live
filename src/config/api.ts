// src/config/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = {
  base: API_URL,
  health: `${API_URL}/health`,
  upload: `${API_URL}/upload/`,
  process: `${API_URL}/process/`,
  download: (taskId: string) => `${API_URL}/download/${taskId}`,
  status: (taskId: string) => `${API_URL}/status/${taskId}`,
  // Additional endpoints based on the backend structure
  separate: `${API_URL}/separate`,
  stems: `${API_URL}/stems`,
  original_audio: `${API_URL}/original_audio`,
};

// Helper para fazer requests
export const fetchAPI = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response;
};

// Helper para upload de arquivos (sem Content-Type para FormData)
export const fetchUpload = async (endpoint: string, formData: FormData) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload Error: ${response.statusText}`);
  }
  
  return response;
};

// Helper para download de arquivos
export const downloadFile = async (url: string, filename: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download Error: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

// Debug info (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 API Config:', {
    API_URL,
    endpoints: api,
    env: import.meta.env.VITE_API_URL
  });
} 