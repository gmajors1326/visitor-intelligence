'use client';

import { useEffect, useState } from 'react';
import styles from '@/components/Dashboard.module.css';
import Navigation from '@/components/Navigation';

interface Session {
  id: string;
  sessionId: string;
  ipHash: string | null;
  firstSeen: string;
  lastSeen: string;
  pageViews: number;
  score: number;
  isHot: boolean;
  country: string | null;
  deviceType: string | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hotOnly, setHotOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [hotOnly]);

  const fetchSessions = async () => {
    try {
      const url = `/api/sessions?hot=${hotOnly}&limit=100`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading sessions...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className={styles.container}>
        <header className={styles.header}>
        <h1 className={styles.title}>Sessions</h1>
        <div>
          <button
            className={`${styles.button} ${hotOnly ? styles.buttonPrimary : ''}`}
            onClick={() => setHotOnly(!hotOnly)}
          >
            {hotOnly ? 'Show All' : 'Hot Only'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>IP Hash</th>
                <th>Country</th>
                <th>Device</th>
                <th>Page Views</th>
                <th>Score</th>
                <th>Status</th>
                <th>First Seen</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No sessions found
                  </td>
                </tr>
              ) : (
                sessions.map(session => (
                  <tr key={session.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {session.sessionId.substring(0, 16)}...
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {session.ipHash ? `${session.ipHash.substring(0, 8)}...` : 'N/A'}
                    </td>
                    <td>{session.country || 'Unknown'}</td>
                    <td>{session.deviceType || 'Unknown'}</td>
                    <td>{session.pageViews}</td>
                    <td>{session.score}</td>
                    <td>
                      {session.isHot ? (
                        <span className={`${styles.badge} ${styles.badgeWarning}`}>Hot</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeInfo}`}>Normal</span>
                      )}
                    </td>
                    <td>{new Date(session.firstSeen).toLocaleString()}</td>
                    <td>{new Date(session.lastSeen).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
    </>
  );
}
