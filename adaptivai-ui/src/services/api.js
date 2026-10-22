import axios from 'axios';

const API_BASE_URL = 'http://localhost:5133/api/coach'; 

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

export const getUserRoutines = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/routines/${userId}`);
  return response.data;
};

export const saveUserRoutine = async (userId, routineData) => {
  const response = await axios.post(`${API_BASE_URL}/routines/${userId}`, routineData);
  return response.data;
};

export const getWorkoutHistory = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/history/${userId}`);
  return response.data;
};