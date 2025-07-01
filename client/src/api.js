import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5003',  // ✅ Your Flask backend URL (change to deployed URL later)
});

export default api;
