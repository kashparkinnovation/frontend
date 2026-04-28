'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import PhoneOTP from '@/components/auth/PhoneOTP';
import type { AuthTokens, UserRole } from '@/types';
import styles from '../login/auth.module.css';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Student / Parent' },
];

const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/admin', vendor: '/vendor', school: '/school', student: '/',
};

export default function RegisterPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  
  const [form, setForm] = useState({
    email: '', first_name: '', last_name: '', phone: '',
    role: 'student' as UserRole, password: '', password2: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post<AuthTokens>('/auth/register/', form);
      Cookies.set('access_token', data.access, { expires: 1 / 24 });
      Cookies.set('refresh_token', data.refresh, { expires: 7 });
      Cookies.set('user', JSON.stringify(data.user), { expires: 7 });
      router.push(ROLE_REDIRECTS[data.user.role]);
    } catch (err: any) {
      const errData = err?.response?.data;
      if (typeof errData === 'object') {
        const msgs = Object.values(errData).flat().join(' ');
        setError(msgs);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = async (idToken: string) => {
    setError('');
    
    if (!form.email || !form.first_name || !form.last_name) {
      setError('Please fill in your name and email before verifying OTP.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post<AuthTokens>('/auth/otp/register/', {
        id_token: idToken,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        role: form.role
      });
      Cookies.set('access_token', data.access, { expires: 1 / 24 });
      Cookies.set('refresh_token', data.refresh, { expires: 7 });
      Cookies.set('user', JSON.stringify(data.user), { expires: 7 });
      router.push(ROLE_REDIRECTS[data.user.role]);
    } catch (err: any) {
      const errData = err?.response?.data;
      if (typeof errData === 'object') {
        const msgs = Object.values(errData).flat().join(' ');
        setError(msgs);
      } else {
        setError('OTP registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          <h1 className={styles.logoText}>eSchoolKart</h1>
        </div>
        <h2 className={styles.heading}>Create an account</h2>
        <p className={styles.subheading}>Join the platform</p>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '0.5rem'
        }}>
          <button
            type="button"
            onClick={() => setAuthMethod('password')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              fontWeight: 600,
              color: authMethod === 'password' ? 'var(--color-primary)' : '#6b7280',
              borderBottom: authMethod === 'password' ? '2px solid var(--color-primary)' : 'none',
              paddingBottom: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Password
          </button>
          <button
            id="otp-tab"
            type="button"
            onClick={() => setAuthMethod('otp')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              fontWeight: 600,
              color: authMethod === 'otp' ? 'var(--color-primary)' : '#6b7280',
              borderBottom: authMethod === 'otp' ? '2px solid var(--color-primary)' : 'none',
              paddingBottom: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Phone OTP
          </button>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {authMethod === 'password' ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>First Name</label>
                <input name="first_name" className="input" placeholder="John" value={form.first_name} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Last Name</label>
                <input name="last_name" className="input" placeholder="Doe" value={form.last_name} onChange={handleChange} required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email address</label>
              <input name="email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Phone (optional)</label>
              <input name="phone" className="input" placeholder="+91 9999999999" value={form.phone} onChange={handleChange} />
            </div>


            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input name="password" type="password" className="input" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input name="password2" type="password" className="input" placeholder="••••••••" value={form.password2} onChange={handleChange} required />
            </div>

            <button id="register-btn" type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>First Name</label>
                <input name="first_name" className="input" placeholder="John" value={form.first_name} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Last Name</label>
                <input name="last_name" className="input" placeholder="Doe" value={form.last_name} onChange={handleChange} required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email address</label>
              <input name="email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>


            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                Verify Phone Number to Register
              </p>
              <PhoneOTP onVerified={handleOTPVerified} buttonText="Register" />
            </div>
          </div>
        )}

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
