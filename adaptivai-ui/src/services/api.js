import axios from 'axios';

const API_BASE_URL = 'http://localhost:5133/api/coach';

const api = axios.create({
  baseURL: 'http://localhost:5133/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 Unauthorized durumunda oturumu temizleyip login'e yönlendir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- Günlük Check-In & AI Adaptasyonu ---
export const checkInAndAdapt = async (userId, data) => {
  const response = await axios.post(`${API_BASE_URL}/check-in-and-adapt?userId=${userId}`, data);
  return response.data;
};

export const chatWithCoach = async (userId, message) => {
  const response = await axios.post(`${API_BASE_URL}/chat`, { userId, message });
  return response.data;
};

export const getTodayStatus = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/today/${userId}`);
  return response.data;
};

export const getWorkoutHistory = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/history/${userId}`);
  return response.data;
};

// --- Rutin & Antrenman Planı İşlemleri ---
export const getUserRoutines = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/routines/${userId}`);
  return response.data;
};

export const saveUserRoutine = async (userId, routineData) => {
  const payload = Array.isArray(routineData) ? { days: routineData } : routineData;
  const response = await axios.post(`${API_BASE_URL}/routines/${userId}`, payload);
  return response.data;
};

// --- Program Havuzu (Multi-Program) Fonksiyonları ---
export const getUserPrograms = async (userId) => {
  const response = await api.get(`/coach/programs/${userId}`);
  return response.data;
};

export const createProgram = async (userId, payload) => {
  let formattedPlan = payload.plan;
  if (Array.isArray(payload.plan)) {
    formattedPlan = { days: payload.plan };
  } else if (payload.plan && !payload.plan.days && payload.plan.Days) {
    formattedPlan = { days: payload.plan.Days };
  }

  const finalPayload = {
    name: payload.name || 'Yeni Antrenman Programı',
    description: payload.description || '',
    setAsActive: payload.setAsActive ?? true,
    plan: formattedPlan,
  };

  const response = await api.post(`/coach/programs/${userId}`, finalPayload);
  return response.data;
};

export const setActiveProgram = async (userId, programId) => {
  const response = await api.post(`/coach/programs/${userId}/activate/${programId}`);
  return response.data;
};

export const deleteProgram = async (userId, programId) => {
  const response = await api.delete(`/coach/programs/${userId}/${programId}`);
  return response.data;
};

// --- AI Optimal Program Üretimi ---
export const generateOptimalRoutine = async (payload) => {
  const response = await api.post('/coach/generate-optimal-routine', payload);
  return response.data;
};

// --- Progressive Overload & Deload Analiz Motoru ---
export const getOverloadAdvice = async (userId) => {
  const response = await api.get(`/coach/overload-advice/${userId}`);
  return response.data;
};

// --- Kullanıcı Profil İşlemleri ---
export const getUserProfile = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/profile/${userId}`);
  return response.data;
};

export const saveUserProfile = async (userId, profileData) => {
  const response = await axios.post(`${API_BASE_URL}/profile/${userId}`, profileData);
  return response.data;
};

export const logWorkoutWeights = async (userId, weights) => {
  const response = await api.post(`/coach/log-workout-weights/${userId}`, { weights });
  return response.data;
};

export const getChatHistory = async (userId) => {
  const response = await api.get(`/coach/chat/history/${userId}`);
  return response.data;
};

export default api;