'use client';

import React, { useState } from 'react';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ActionCodeSettings,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface EmailOTPProps {
  /** Called with the Firebase ID token once the email link is verified */
  onVerified: (idToken: string) => void;
  buttonText?: string;
}

/**
 * Two-phase component:
 *  Phase 1 – user enters email → we send a magic-link OTP email via Firebase
 *  Phase 2 – user clicks the link in their inbox, lands back on the same page
 *             → we detect the link in the URL and silently finish sign-in
 */
export default function EmailOTP({ onVerified, buttonText = 'Continue' }: EmailOTPProps) {
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(false);

  // ── Action-code settings ────────────────────────────────────────────────────
  const actionCodeSettings: ActionCodeSettings = {
    // After clicking the link, Firebase redirects here
    url: typeof window !== 'undefined'
      ? `${window.location.origin}/auth/email-verify`
      : 'http://localhost:3000/auth/email-verify',
    handleCodeInApp: true,
  };

  // ── Phase 1: send the sign-in link ─────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save the email locally so we can use it when the link is clicked
      window.localStorage.setItem('emailForSignIn', email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Phase 2: complete sign-in after clicking the email link ─────────────────
  //    (Called manually when user says "I've clicked the link")
  const handleVerifyLink = async () => {
    setError('');
    const href = window.location.href;

    if (!isSignInWithEmailLink(auth, href)) {
      setError(
        'No valid sign-in link found in your browser. ' +
        'Please click the link directly from your email on this device.'
      );
      return;
    }

    let targetEmail = window.localStorage.getItem('emailForSignIn') || email;
    if (!targetEmail) {
      targetEmail = window.prompt('Please re-enter your email to confirm:') || '';
    }

    setVerifying(true);
    try {
      const result = await signInWithEmailLink(auth, targetEmail, href);
      window.localStorage.removeItem('emailForSignIn');
      const idToken = await result.user.getIdToken();
      onVerified(idToken);
    } catch (err: any) {
      setError(err.message || 'Email link verification failed. Try sending a new link.');
    } finally {
      setVerifying(false);
    }
  };

  // ── Auto-detect link on mount ───────────────────────────────────────────────
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      const savedEmail = window.localStorage.getItem('emailForSignIn');
      if (savedEmail) {
        setEmail(savedEmail);
        setSent(true);
        // Trigger automatic verification
        handleVerifyLink();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {error && (
        <div style={{
          background: '#fee2e2', color: '#991b1b', fontSize: '0.875rem',
          padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
          border: '1px solid #fecaca', marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {!sent ? (
        /* ── Phase 1: Email input ── */
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label
              htmlFor="email-otp-input"
              style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary, #374151)' }}
            >
              Email address
            </label>
            <input
              id="email-otp-input"
              type="email"
              placeholder="you@example.com"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}>
              We'll send a one-time magic link to your inbox
            </span>
          </div>

          <button
            id="send-email-otp-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Sending…' : '✉️  Send Magic Link'}
          </button>
        </form>
      ) : (
        /* ── Phase 2: Waiting for user to click the link ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: '0.5rem', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
          }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1e40af', fontSize: '0.95rem' }}>
              ✉️ Check your inbox!
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>
              We sent a sign-in link to <strong>{email}</strong>.
              Open it on <strong>this device</strong> and click the link.
            </p>
          </div>

          <button
            id="verify-email-link-btn"
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleVerifyLink}
            disabled={verifying}
          >
            {verifying ? 'Verifying…' : `${buttonText} after clicking the link`}
          </button>

          <button
            type="button"
            onClick={() => { setSent(false); setError(''); }}
            style={{
              background: 'none', border: 'none',
              color: 'var(--color-primary, #4f46e5)', fontSize: '0.875rem',
              fontWeight: 500, cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            ← Change email / resend
          </button>
        </div>
      )}
    </div>
  );
}
