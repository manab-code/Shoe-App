import axios from 'axios';

const API_URL = 'http://10.0.2.2:8080/api';

export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password });
  return response.data;
};

export const signupUser = async (name, email, password) => {
  const response = await axios.post(`${API_URL}/auth/signup`, { name, email, password });
  return response.data;
};

export const getProducts = async (token) => {
  const response = await axios.get(`${API_URL}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
