'use client';

import { useEffect, useState } from 'react';
import styles from './ConsentBanner.module.css';

export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if consent was already given
    const consent = localStorage.getItem('visitor_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = async () => {
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: true }),
      });
      localStorage.setItem('visitor_consent', 'true');
      setShow(false);
    } catch (error) {
      console.error('Error saving consent:', error);
    }
  };

  const handleDecline = () => {
    localStorage.setItem('visitor_consent', 'false');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.title}>Privacy & Analytics Consent</div>
        <div className={styles.description}>
          We use analytics to understand how visitors interact with our site. 
          This helps us improve your experience. Your data is anonymized and secure.
        </div>
      </div>
      <div className={styles.actions}>
        <button className={`${styles.button} ${styles.buttonDecline}`} onClick={handleDecline}>
          Decline
        </button>
        <button className={`${styles.button} ${styles.buttonAccept}`} onClick={handleAccept}>
          Accept
        </button>
      </div>
    </div>
  );
}
