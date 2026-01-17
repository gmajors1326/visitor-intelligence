import type { Metadata } from 'next';
import './globals.css';
import ConsentBanner from '@/components/ConsentBanner';
import HeatmapTracker from '@/components/HeatmapTracker';

export const metadata: Metadata = {
  title: 'Visitor Intelligence Dashboard',
  description: 'Real-time visitor analytics and intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ConsentBanner />
        <HeatmapTracker />
      </body>
    </html>
  );
}
