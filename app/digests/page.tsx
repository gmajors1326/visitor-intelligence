'use client';

import { useEffect, useState } from 'react';
import styles from '@/components/Dashboard.module.css';
import Navigation from '@/components/Navigation';

interface Digest {
  id: string;
  date: string;
  totalVisitors: number;
  uniqueSessions: number;
  pageViews: number;
  botsDetected: number;
  aiDetected: number;
  hotSessions: number;
  topPages: Array<{ url: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  topDevices: Array<{ deviceType: string; count: number }>;
}

export default function DigestsPage() {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchDigests();
  }, []);

  const fetchDigests = async () => {
    try {
      const res = await fetch('/api/digest?limit=30');
      if (!res.ok) throw new Error('Failed to fetch digests');
      const data = await res.json();
      setDigests(data.digests || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching digests:', error);
      setLoading(false);
    }
  };

  const generateDigest = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/digest', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate digest');
      await fetchDigests();
      alert('Digest generated successfully!');
    } catch (error) {
      alert('Error generating digest');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading digests...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className={styles.container}>
        <header className={styles.header}>
        <h1 className={styles.title}>Daily Digests</h1>
        <div>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={generateDigest}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Today\'s Digest'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {digests.length === 0 ? (
          <div className={styles.card}>
            <p style={{ color: 'var(--text-tertiary)' }}>No digests found. Generate one to get started.</p>
          </div>
        ) : (
          digests.map(digest => (
            <div key={digest.id} className={styles.section}>
              <div className={styles.card}>
                <h2 className={styles.sectionTitle}>
                  {new Date(digest.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>

                <div className={styles.statsGrid} style={{ marginBottom: '1.5rem' }}>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Visitors</div>
                    <div className={styles.statValue}>{digest.totalVisitors.toLocaleString()}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Unique Sessions</div>
                    <div className={styles.statValue}>{digest.uniqueSessions.toLocaleString()}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Page Views</div>
                    <div className={styles.statValue}>{digest.pageViews.toLocaleString()}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Bots Detected</div>
                    <div className={styles.statValue}>{digest.botsDetected.toLocaleString()}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>AI Detected</div>
                    <div className={styles.statValue}>{digest.aiDetected.toLocaleString()}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Hot Sessions</div>
                    <div className={styles.statValue}>{digest.hotSessions.toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <h3 className={styles.sectionTitle} style={{ fontSize: '1rem' }}>Top Pages</h3>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>URL</th>
                          <th>Views</th>
                        </tr>
                      </thead>
                      <tbody>
                        {digest.topPages?.map((page, idx) => (
                          <tr key={idx}>
                            <td>{page.url}</td>
                            <td>{page.count.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className={styles.sectionTitle} style={{ fontSize: '1rem' }}>Top Countries</h3>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Country</th>
                          <th>Visitors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {digest.topCountries?.map((country, idx) => (
                          <tr key={idx}>
                            <td>{country.country || 'Unknown'}</td>
                            <td>{country.count.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className={styles.sectionTitle} style={{ fontSize: '1rem' }}>Top Devices</h3>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Device</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {digest.topDevices?.map((device, idx) => (
                          <tr key={idx}>
                            <td>{device.deviceType}</td>
                            <td>{device.count.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
    </>
  );
}
