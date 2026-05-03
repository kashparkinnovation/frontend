'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PhoneOTP from '@/components/auth/PhoneOTP';
import EmailOTP from '@/components/auth/EmailOTP';
import styles from './auth.module.css';

type Method = 'phone' | 'password' | 'email';

// ── Tab order: Phone OTP → Password → Email Link ────────────────────────────
const TABS: { id: Method; label: string; icon: string }[] = [
  { id: 'phone',    label: 'Phone OTP',  icon: '📱' },
  { id: 'password', label: 'Password',   icon: '🔑' },
  { id: 'email',    label: 'Email Link', icon: '✉️' },
];


export default function LoginPage() {
  const { login, loginWithOTP, loginWithEmailOTP } = useAuth();
  const [method, setMethod]     = useState<Method>('phone');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const wrap = async (fn: () => Promise<void>) => {
    setError(''); setLoading(true);
    try { await fn(); }
    catch (err: any) {
      const d = err?.response?.data;
      setError(
        typeof d === 'string' ? d
        : d?.detail ?? d?.non_field_errors?.[0]
          ?? 'Login failed. Please check your credentials.'
      );
    } finally { setLoading(false); }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    wrap(() => login(email, password));
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          <h1 className={styles.logoText}>eSchoolKart</h1>
        </div>
        <h2 className={styles.heading}>Welcome back</h2>
        <p className={styles.subheading}>Sign in to your account</p>

        {/* 3-tab selector */}
        <div style={{
          display: 'flex', borderBottom: '2px solid #e5e7eb',
          marginBottom: '1.5rem', gap: '0',
        }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              id={`tab-${t.id}`}
              onClick={() => { setMethod(t.id); setError(''); }}
              style={{
                flex: 1, background: 'none', border: 'none',
                fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                paddingBottom: '0.625rem', paddingTop: '0.25rem',
                color: method === t.id ? 'var(--color-primary, #4f46e5)' : '#6b7280',
                borderBottom: method === t.id
                  ? '2px solid var(--color-primary, #4f46e5)'
                  : '2px solid transparent',
                marginBottom: '-2px', whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* ── Password ── */}
        {method === 'password' && (
          <form onSubmit={handlePasswordLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email address</label>
              <input id="email" type="email" className="input"
                placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={styles.label}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textDecoration: 'underline' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPassword ? 'text' : 'password'} className="input"
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
                    fontSize: '1rem', padding: '0.2rem'
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            <button id="login-btn" type="submit" className="btn btn-primary"
              style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Phone SMS OTP ── */}
        {method === 'phone' && (
          <PhoneOTP
            buttonText="Sign In"
            onVerified={(idToken) => wrap(() => loginWithOTP(idToken))}
          />
        )}

        {/* ── Email magic-link OTP ── */}
        {method === 'email' && (
          <EmailOTP
            buttonText="Sign In"
            onVerified={(idToken) => wrap(() => loginWithEmailOTP(idToken))}
          />
        )}

        <p className={styles.switchLink}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
