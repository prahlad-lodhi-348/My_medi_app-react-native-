import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from 'axios';
import { getBaseUrl } from './baseUrl';
import { getToken } from '../storage/tokenStorage';
import { ApiError } from '../types/api';

const baseURL = getBaseUrl();

if (!baseURL) {
  // Requests with an empty baseURL tend to look like “Network error”.
  // eslint-disable-next-line no-console
  console.warn(
    '[ApiClient] Missing API base URL. Check react-native-config API_URL/BASE_URL'
  );
}

const toApiError = (error: AxiosError): ApiError => {
  const status = error.response?.status;
  const message =
    (error.response?.data as any)?.detail ||
    (error.response?.data as any)?.message ||
    error.message;

  if (!status) {
    return { kind: 'network', message: message || 'Network error' };
  }

  switch (status) {
    case 401:
      return {
        kind: 'unauthorized',
        status,
        message: message || 'Unauthorized',
      };
    case 403:
      return {
        kind: 'forbidden',
        status,
        message: message || 'Forbidden',
      };
    case 404:
      return { kind: 'not_found', status, message: message || 'Not found' };
    case 400:
      return {
        kind: 'validation',
        status,
        message: message || 'Bad request',
        details: error.response?.data,
      };
    case 500:
    default:
      return {
        kind: status >= 500 ? 'server' : 'unknown',
        status,
        message: message || 'Server error',
        details: error.response?.data,
      };
  }
};

export class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL,
      timeout: 20000,
      headers: {
        Accept: 'application/json',
      },
    });

    this.instance.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers = config.headers || {};
        // NOTE: This client currently assumes Token <token> (DRF-style).
        // If you are using Firebase/Auth elsewhere, you should remove/replace this.
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (res) => res,
      (error) => {
        const apiError = toApiError(error);
        return Promise.reject(apiError);
      }
    );
  }

  public async request<T>(
    config: AxiosRequestConfig
  ): Promise<T> {
    const res = await this.instance.request<T>(config);
    return res.data;
  }
}

export const apiClient = new ApiClient();

