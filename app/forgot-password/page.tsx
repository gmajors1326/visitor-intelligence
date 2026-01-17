'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import styles from '../login/login.module.css';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      setCaptchaLoaded(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Get reCAPTCHA token if configured
      let captchaToken = '';
      if (captchaLoaded && window.grecaptcha) {
        try {
          captchaToken = await window.grecaptcha.execute(
            process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
            { action: 'forgot_password' }
          );
        } catch (err) {
          console.error('CAPTCHA error:', err);
        }
      }

      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, captchaToken }),
      });

      const data = await res.json();

      if (res.ok) {
        // Always show success message (prevents email enumeration)
        setSuccess(data.message || 'If the email exists, a password reset link has been sent.');
        
        // In development, show the reset URL if provided
        if (data.resetUrl) {
          setSuccess(
            `Password reset link generated:\n\n${data.resetUrl}\n\n(This is shown in development mode only)`
          );
        }
        
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      } else {
        // Even on error, show generic message to prevent enumeration
        setSuccess('If the email exists, a password reset link has been sent.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setError('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {captchaLoaded && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="lazyOnload"
        />
      )}
      <div className={styles.container}>
        <div className={styles.loginBox}>
        <h1 className={styles.title}>Forgot Password</h1>
        <p className={styles.subtitle}>Enter your email to receive a password reset link</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={styles.input}
            required
            autoFocus
          />
          {error && <div className={styles.error}>{error}</div>}
          {success && <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: '0.875rem', textAlign: 'center' }}>{success}</div>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
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
    </>
  );
}
