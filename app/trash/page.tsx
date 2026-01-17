'use client';

import { useEffect, useState } from 'react';
import styles from '@/components/Dashboard.module.css';
import Navigation from '@/components/Navigation';

interface TrashItem {
  id: string;
  type: 'visitor' | 'session' | 'alert';
  data: any;
  deletedAt: string;
}

export default function TrashPage() {
  const [trash, setTrash] = useState<{
    visitors: any[];
    sessions: any[];
    alerts: any[];
  }>({ visitors: [], sessions: [], alerts: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'visitors' | 'sessions' | 'alerts'>('all');

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      const res = await fetch('/api/trash');
      if (!res.ok) throw new Error('Failed to fetch trash');
      const data = await res.json();
      setTrash(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trash:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string, permanent: boolean) => {
    if (!confirm(`Are you sure you want to ${permanent ? 'permanently delete' : 'move to trash'} this ${type}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/${type}s/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, permanent }),
      });

      if (res.ok) {
        await fetchTrash();
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  const handleRestore = async (type: string, id: string) => {
    try {
      const res = await fetch(`/api/${type}s/delete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        await fetchTrash();
      } else {
        alert('Failed to restore');
      }
    } catch (error) {
      console.error('Error restoring:', error);
      alert('Failed to restore');
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className={styles.container}>
          <div className={styles.loading}>Loading trash...</div>
        </div>
      </>
    );
  }

  const allItems: TrashItem[] = [
    ...trash.visitors.map(v => ({ id: v.id, type: 'visitor' as const, data: v, deletedAt: v.deletedAt })),
    ...trash.sessions.map(s => ({ id: s.id, type: 'session' as const, data: s, deletedAt: s.deletedAt })),
    ...trash.alerts.map(a => ({ id: a.id, type: 'alert' as const, data: a, deletedAt: a.deletedAt })),
  ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

  const filteredItems = filter === 'all' 
    ? allItems 
    : allItems.filter(item => item.type === filter.slice(0, -1)); // Remove 's' from 'visitors' -> 'visitor'

  return (
    <>
      <Navigation />
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Trash / History</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className={styles.button}
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              style={{ padding: '0.5rem 1rem' }}
            >
              <option value="all">All Items</option>
              <option value="visitors">Visitors</option>
              <option value="sessions">Sessions</option>
              <option value="alerts">Alerts</option>
            </select>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.card}>
            {filteredItems.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' }}>
                Trash is empty
              </p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Deleted At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={`${item.type}-${item.id}`}>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeInfo}`}>
                          {item.type}
                        </span>
                      </td>
                      <td>
                        {item.type === 'visitor' && (
                          <span>{item.data.url} - {item.data.method}</span>
                        )}
                        {item.type === 'session' && (
                          <span>Session: {item.data.sessionId?.substring(0, 16)}...</span>
                        )}
                        {item.type === 'alert' && (
                          <span>{item.data.title}</span>
                        )}
                      </td>
                      <td>{new Date(item.deletedAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className={styles.button}
                            onClick={() => handleRestore(item.type, item.id)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            Restore
                          </button>
                          <button
                            className={styles.button}
                            onClick={() => handleDelete(item.type, item.id, true)}
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '0.25rem 0.5rem',
                              background: 'var(--error)',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
