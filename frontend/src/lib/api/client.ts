import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

function getApiBaseUrl(): string {
  // 1. Explicit public override (e.g. Railway backend URL configured on Vercel)
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    if (url.endsWith('/api/v1') || url.endsWith('/v1')) {
      return url;
    }
    return `${url}/api/v1`;
  }

  // 2. Server-side rendering fallback
  if (typeof window === 'undefined') {
    if (process.env.BACKEND_API_URL || process.env.BACKEND_URL) {
      const backend = (process.env.BACKEND_API_URL || process.env.BACKEND_URL)!.replace(/\/$/, '');
      return backend.endsWith('/api/v1') ? backend : `${backend}/api/v1`;
    }
    return 'http://127.0.0.1:8000/api/v1';
  }

  // 3. Browser in local development (localhost / 127.0.0.1): connect directly to FastAPI server
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://127.0.0.1:8000/api/v1';
  }

  // 4. Browser in production on Vercel: use same-domain relative path (proxied by Next.js rewrites)
  return '/api/v1';
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
          errorMessage = error.message;
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
