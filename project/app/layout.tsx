import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';
import { MetricsProvider } from '@/lib/metrics-context';

export const metadata: Metadata = {
  title: 'Tabby.ai — Performance Dashboard',
  description: 'Real-time contact center performance tracking',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MetricsProvider>
          {children}
        </MetricsProvider>
      </body>
    </html>
  );
}
