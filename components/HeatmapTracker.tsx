'use client';

import { useEffect } from 'react';

export default function HeatmapTracker() {
  useEffect(() => {
    // Only track if consent was given
    const consent = localStorage.getItem('visitor_consent');
    if (consent !== 'true') {
      return;
    }

    const trackClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const url = window.location.pathname + window.location.search;
      
      fetch('/api/heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          x: e.clientX,
          y: e.clientY,
          element: target.tagName,
          eventType: 'click',
        }),
      }).catch(() => {
        // Silently fail
      });
    };

    const trackScroll = () => {
      const url = window.location.pathname + window.location.search;
      const scrollY = window.scrollY;
      
      fetch('/api/heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          y: scrollY,
          eventType: 'scroll',
        }),
      }).catch(() => {
        // Silently fail
      });
    };

    // Throttle scroll events
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(trackScroll, 1000);
    };

    document.addEventListener('click', trackClick);
    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      document.removeEventListener('click', trackClick);
      window.removeEventListener('scroll', throttledScroll);
    };
  }, []);

  return null;
}
