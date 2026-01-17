'use client';

import { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';

interface Stats {
  today: {
    visitors: number;
    sessions: number;
    bots: number;
    ai: number;
    hotSessions: number;
    unreadAlerts: number;
  };
  topPages: Array<{ url: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchStats();
      fetchAlerts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch stats (${res.status})`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setStats(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load stats';
      setError(errorMsg);
      setLoading(false);
      console.error('Stats fetch error:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts?isRead=false&limit=10');
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  const markAlertRead = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      });
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const badges: Record<string, string> = {
      low: styles.badgeInfo,
      medium: styles.badgeWarning,
      high: styles.badgeError,
      critical: styles.badgeError,
    };
    return badges[severity] || styles.badgeInfo;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Visitor Intelligence Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => window.location.reload()}>
            Refresh
          </button>
          <button
            className={styles.button}
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {stats && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Visitors Today</div>
                <div className={styles.statValue}>{stats.today.visitors.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Sessions</div>
                <div className={styles.statValue}>{stats.today.sessions.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Bots Detected</div>
                <div className={styles.statValue}>{stats.today.bots.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>AI Detected</div>
                <div className={styles.statValue}>{stats.today.ai.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Hot Sessions</div>
                <div className={styles.statValue}>{stats.today.hotSessions.toLocaleString()}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Unread Alerts</div>
                <div className={styles.statValue}>{stats.today.unreadAlerts.toLocaleString()}</div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Recent Alerts</h2>
              <div className={styles.card}>
                {alerts.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)' }}>No unread alerts</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Severity</th>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map(alert => (
                        <tr key={alert.id}>
                          <td>
                            <span className={`${styles.badge} ${getSeverityBadge(alert.severity)}`}>
                              {alert.severity}
                            </span>
                          </td>
                          <td>{alert.title}</td>
                          <td>{alert.message}</td>
                          <td>{new Date(alert.createdAt).toLocaleString()}</td>
                          <td>
                            <button
                              className={styles.button}
                              onClick={() => markAlertRead(alert.id)}
                            >
                              Mark Read
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Top Pages</h2>
              <div className={styles.card}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>URL</th>
                      <th>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPages.map((page, idx) => (
                      <tr key={idx}>
                        <td>{page.url}</td>
                        <td>{page.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Top Countries</h2>
              <div className={styles.card}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topCountries.map((country, idx) => (
                      <tr key={idx}>
                        <td>{country.country || 'Unknown'}</td>
                        <td>{country.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
