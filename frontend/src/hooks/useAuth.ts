'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { User, AuthResponse } from '@/types/auth';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, setLoading, clearAuth } =
    useAuthStore();

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await apiClient.get<User>('/auth/me');
      setUser(currentUser);
      return currentUser;
    } catch {
      clearAuth();
      return null;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, clearAuth]);

  useEffect(() => {
    // Check initial auth state on app mount
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    setUser(data.user);
    return data.user;
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    department?: string;
    course?: string;
    academic_year?: string;
  }): Promise<User> => {
    const data = await apiClient.post<User>('/auth/register', payload);
    return data;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const verifyEmail = async (token: string) => {
    const res = await apiClient.post<{ message: string; is_email_verified: boolean }>(
      '/auth/verify-email',
      { token }
    );
    // Refresh user state after verification
    await fetchCurrentUser();
    return res;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    verifyEmail,
    refetchUser: fetchCurrentUser,
  };
}
