import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

let authToken: string | null = null;

// Backend API base URL - can be set via VITE_API_BASE_URL environment variable
// Default: API Gateway production URL
const apiBaseURL = import.meta.env.VITE_API_BASE_URL || "https://7yum264ntc.execute-api.eu-west-1.amazonaws.com/prod/api";

export const apiClient = axios.create({
  baseURL: apiBaseURL,
  withCredentials: false,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const setAuthToken = (token: string | null) => {
  authToken = token;
};
