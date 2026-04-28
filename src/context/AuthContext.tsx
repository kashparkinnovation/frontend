'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import type { User, AuthTokens, UserRole } from '@/types';

interface AuthContextValue {
  user:            User | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  role:            UserRole | null;
  login:              (email: string, password: string) => Promise<void>;
  loginWithOTP:       (idToken: string)                 => Promise<void>;
  loginWithEmailOTP:  (idToken: string)                 => Promise<void>;
  /** Set session directly from token data — use after register to avoid re-login */
  setSession:         (data: AuthTokens)                => void;
  logout:             ()                                => Promise<void>;
  updateUser:         (userData: User)                  => void;
}

const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/admin', vendor: '/vendor', school: '/school', student: '/',
};

export function saveSession(data: AuthTokens) {
  Cookies.set('access_token', data.access,        { expires: 1 / 24 });
  Cookies.set('refresh_token', data.refresh,      { expires: 7 });
  Cookies.set('user', JSON.stringify(data.user),  { expires: 7 });
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const router                  = useRouter();

  useEffect(() => {
    const stored = Cookies.get('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { Cookies.remove('user'); }
    }
    setLoading(false);
  }, []);

  // ── Set session + update in-memory state (use after register) ──────────────
  const setSession = useCallback((data: AuthTokens) => {
    saveSession(data);
    setUser(data.user);
  }, []);

  // ── Email + password login ─────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<AuthTokens>('/auth/login/', { email, password });
    setSession(data);
    router.push(ROLE_REDIRECTS[data.user.role]);
  }, [router, setSession]);

  // ── Phone SMS OTP login ────────────────────────────────────────────────────
  const loginWithOTP = useCallback(async (idToken: string) => {
    const { data } = await apiClient.post<AuthTokens>('/auth/otp/login/', { id_token: idToken });
    setSession(data);
    router.push(ROLE_REDIRECTS[data.user.role]);
  }, [router, setSession]);

  // ── Email magic-link OTP login ─────────────────────────────────────────────
  const loginWithEmailOTP = useCallback(async (idToken: string) => {
    const { data } = await apiClient.post<AuthTokens>('/auth/otp/email-login/', { id_token: idToken });
    setSession(data);
    router.push(ROLE_REDIRECTS[data.user.role]);
  }, [router, setSession]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const refresh = Cookies.get('refresh_token');
      await apiClient.post('/auth/logout/', { refresh });
    } catch { /* ignore */ } finally {
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
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated: !!user, role: user?.role ?? null,
      login, loginWithOTP, loginWithEmailOTP, setSession, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
