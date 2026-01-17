'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import styles from './login.module.css';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if reCAPTCHA site key is configured
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      setCaptchaLoaded(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get reCAPTCHA token if configured
      let captchaToken = '';
      if (captchaLoaded && window.grecaptcha) {
        try {
          captchaToken = await window.grecaptcha.execute(
            process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
            { action: 'login' }
          );
        } catch (err) {
          console.error('CAPTCHA error:', err);
        }
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password, 
          twoFactorCode: requires2FA ? twoFactorCode : undefined,
          captchaToken,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
          setError('');
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      } else {
        setError(data.error || 'Invalid credentials');
        setRequires2FA(false);
      }
    } catch (err) {
      setError('Failed to authenticate');
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
          <h1 className={styles.title}>Visitor Intelligence</h1>
          <p className={styles.subtitle}>
            {requires2FA ? 'Enter your 2FA code' : 'Enter password to access dashboard'}
          </p>
          <form onSubmit={handleSubmit} className={styles.form}>
            {!requires2FA ? (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={styles.input}
                required
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className={styles.input}
                required
                autoFocus
                maxLength={6}
                pattern="[0-9]{6}"
              />
            )}
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Authenticating...' : requires2FA ? 'Verify Code' : 'Login'}
            </button>
            {!requires2FA && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <a
                  href="/forgot-password"
                  style={{
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                  }}
                >
                  Forgot Password?
                </a>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
