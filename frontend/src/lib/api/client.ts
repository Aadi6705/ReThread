import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

function getApiBaseUrl(): string {
  // 1. Browser runtime: ALWAYS use same-origin relative path /api/v1
  // This proxies seamlessly through Next.js rewrites (configured in next.config.ts)
  // to Railway in production and to 127.0.0.1:8000 in local dev.
  // This eliminates cross-origin CORS preflights, third-party cookie blocks, and network mismatch.
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }

  // 2. Server-side rendering (Node.js runtime on Vercel / server)
  const serverBackend =
    process.env.BACKEND_API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://backend-production-426c301a.up.railway.app';
  const cleanBackend = serverBackend.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  return `${cleanBackend}/api/v1`;
}

const API_BASE_URL = getApiBaseUrl();

export interface ApiErrorResponse {
  detail: string | { msg: string; type: string }[];
  status_code?: number;
}

export class ApiError extends Error {
  statusCode: number;
  data: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      withCredentials: true, // Crucial for HttpOnly session cookies
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    // Request interceptor: attach Bearer token and handle FormData boundary
    this.instance.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('rethread_access_token');
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const statusCode = error.response?.status || 500;
        let errorMessage = 'An unexpected network error occurred.';

        if (error.response?.data) {
          const data = error.response.data as any;
          if (typeof data === 'string') {
            // HTML error response from Vercel edge/proxy or plain text
            errorMessage = error.response.statusText || `Request failed with status ${statusCode}`;
          } else if (typeof data === 'object') {
            const detail = data.detail || data.message || data.error;
            if (typeof detail === 'string') {
              errorMessage = detail;
            } else if (Array.isArray(detail) && detail.length > 0) {
              errorMessage = detail
                .map((d: any) => d.msg || (typeof d === 'string' ? d : JSON.stringify(d)))
                .join(', ');
            }
          }
        } else if (error.message) {
          if (error.message === 'Network Error' || (error as any).code === 'ERR_NETWORK') {
            errorMessage = 'Unable to reach the campus server. Please check your internet connection or verify credentials.';
          } else {
            errorMessage = error.message;
          }
        }

        // Help developers inspect network issues on deployment
        if (typeof window !== 'undefined') {
          console.error('[API Error]', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }

        return Promise.reject(new ApiError(errorMessage, statusCode, error.response?.data));
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
