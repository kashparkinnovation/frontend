'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import type { User, AuthTokens, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore user from cookie on mount
  useEffect(() => {
    const storedUser = Cookies.get('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        Cookies.remove('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<AuthTokens>('/auth/login/', { email, password });
    // Store tokens in cookies (access: 1hr, refresh: 7d)
    Cookies.set('access_token', data.access, { expires: 1 / 24 });
    Cookies.set('refresh_token', data.refresh, { expires: 7 });
    Cookies.set('user', JSON.stringify(data.user), { expires: 7 });
    setUser(data.user);

    // Route to the correct portal based on role
    const roleRedirects: Record<UserRole, string> = {
      admin: '/admin',
      vendor: '/vendor',
      school: '/school',
      student: '/',
    };
    router.push(roleRedirects[data.user.role]);
  }, [router]);

  const logout = useCallback(async () => {
    try {
      const refresh = Cookies.get('refresh_token');
      await apiClient.post('/auth/logout/', { refresh });
    } catch {
      // Ignore logout API errors
    } finally {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('user');
      setUser(null);
      router.push('/');
    }
  }, [router]);

  const updateUser = useCallback((userData: User) => {
    Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        role: user?.role ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
