// src/api.ts
import axios from 'axios';
import { API_BASE_URL } from '../config'; // базовый URL, который динамически определяется

// Создаем инстанс axios с базовым URL и стандартными заголовками
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json;odata=verbose',
    'Content-Type': 'application/json'
  }
});

// Добавляем interceptor для логирования или обработки ошибок (опционально)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
