'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import styles from '@/components/Dashboard.module.css';
import { generateTwoFactorSecret, generateQRCode, generateBackupCodes } from '@/lib/utils/two-factor';

// Note: This is a client component, so we can't directly import server utilities
// The 2FA setup will be handled via API routes

export default function SettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [sessionTimeout, setSessionTimeout] = useState(7 * 24 * 60 * 60); // 7 days in seconds
  const [allowedIPs, setAllowedIPs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(data.twoFactorEnabled || false);
        setSessionTimeout(data.sessionTimeout || 7 * 24 * 60 * 60);
        setAllowedIPs(data.allowedIPs || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupTwoFactor = async () => {
    try {
      // Get 2FA setup from server
      const res = await fetch('/api/settings/2fa/setup', {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Failed to setup 2FA');
      }

      const data = await res.json();
      setTwoFactorSecret(data.secret);
      setQrCodeUrl(data.qrCodeUrl);
      setBackupCodes(data.backupCodes);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      alert('Failed to setup 2FA');
    }
  };

  const enableTwoFactor = async () => {
    try {
      const res = await fetch('/api/settings/2fa/enable', {
        method: 'POST',
      });
      if (res.ok) {
        setTwoFactorEnabled(true);
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
    }
  };

  const disableTwoFactor = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }
    try {
      const res = await fetch('/api/settings/2fa/disable', {
        method: 'POST',
      });
      if (res.ok) {
        setTwoFactorEnabled(false);
        setTwoFactorSecret('');
        setQrCodeUrl('');
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTimeout,
          allowedIPs,
        }),
      });
      alert('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className={styles.container}>
          <div className={styles.loading}>Loading settings...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Security Settings</h1>
        </header>

        <main className={styles.main}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Two-Factor Authentication</h2>
            {twoFactorEnabled ? (
              <div>
                <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                  ✓ Two-factor authentication is enabled
                </p>
                <button className={styles.button} onClick={disableTwoFactor}>
                  Disable 2FA
                </button>
              </div>
            ) : twoFactorSecret ? (
              <div>
                <p>Scan this QR code with your authenticator app:</p>
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="2FA QR Code" style={{ margin: '1rem 0', maxWidth: '200px' }} />
                )}
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  Manual entry key: <code>{twoFactorSecret}</code>
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  Backup codes (save these securely):
                </p>
                <div style={{ 
                  background: 'var(--bg-tertiary)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)',
                  marginTop: '0.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}>
                  {backupCodes.map((code, i) => (
                    <div key={i}>{code}</div>
                  ))}
                </div>
                <button className={styles.button} onClick={enableTwoFactor} style={{ marginTop: '1rem' }}>
                  Enable 2FA
                </button>
              </div>
            ) : (
              <div>
                <p>Two-factor authentication adds an extra layer of security to your account.</p>
                <button className={styles.button} onClick={setupTwoFactor}>
                  Setup 2FA
                </button>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Session Settings</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Session Timeout (days):
              </label>
              <input
                type="number"
                value={sessionTimeout / (24 * 60 * 60)}
                onChange={(e) => setSessionTimeout(parseFloat(e.target.value) * 24 * 60 * 60)}
                min={1}
                max={30}
                className={styles.input}
                style={{ width: '200px' }}
              />
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>IP Allowlist (Optional)</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Restrict login to specific IP addresses. Leave empty to allow all IPs.
            </p>
            <div>
              {allowedIPs.map((ip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={ip}
                    onChange={(e) => {
                      const newIPs = [...allowedIPs];
                      newIPs[i] = e.target.value;
                      setAllowedIPs(newIPs);
                    }}
                    className={styles.input}
                    placeholder="192.168.1.1"
                  />
                  <button
                    className={styles.button}
                    onClick={() => setAllowedIPs(allowedIPs.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className={styles.button}
                onClick={() => setAllowedIPs([...allowedIPs, ''])}
                style={{ marginTop: '0.5rem' }}
              >
                Add IP
              </button>
            </div>
          </div>

          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={saveSettings}
            disabled={saving}
            style={{ marginTop: '2rem' }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </main>
      </div>
    </>
  );
}
