import axios from 'axios';
import { beginLog, finishLog } from '@/stores/logs';

// 通信ログ付きの axios インスタンス。ログはリクエストごとに払い出す ID で対応付ける。
export const http = axios.create({
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  // クエリパラメータを含む完全な URL で記録する
  config.logId = beginLog(method, http.getUri(config));
  return config;
});

http.interceptors.response.use(
  (response) => {
    finishLog(response.config.logId, response.status);
    return response;
  },
  (error) => {
    if (error.config) {
      const status = error.response ? error.response.status : 'エラー';
      finishLog(error.config.logId, status);
    }
    return Promise.reject(error);
  },
);
