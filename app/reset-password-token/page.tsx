'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../login/login.module.css';

function ResetPasswordForm() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setValidating(false);
      setError('No reset token provided');
    }
  }, [searchParams]);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const res = await fetch(`/api/auth/validate-reset-token?token=${tokenToValidate}`);
      if (!res.ok) {
        setError('Invalid or expired reset token');
      }
    } catch (err) {
      setError('Failed to validate token');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.newHash) {
          // Show the hash so user can update it in Vercel
          setSuccess(
            `Password reset successful! Copy this hash and update ADMIN_PASSWORD_HASH in Vercel:\n\n${data.newHash}\n\nThen redeploy your project.`
          );
        } else {
          setSuccess('Password reset successfully! Redirecting to login...');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className={styles.loading}>Validating reset token...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>Enter your new password</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            className={styles.input}
            required
            minLength={8}
            autoFocus
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm New Password"
            className={styles.input}
            required
            minLength={8}
          />
          {error && <div className={styles.error}>{error}</div>}
          {success && (
            <div style={{ 
              padding: '0.75rem', 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid var(--success)', 
              borderRadius: 'var(--radius-md)', 
              color: 'var(--success)', 
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {success}
            </div>
          )}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <button
            type="button"
            className={styles.button}
            style={{ background: 'var(--bg-tertiary)', marginTop: '0.5rem' }}
            onClick={() => router.push('/login')}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordTokenPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
