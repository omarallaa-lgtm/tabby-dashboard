import type { Metadata } from 'next';
import '@/app/globals.css';
import { MetricsProvider } from '@/lib/metrics-context';

export const metadata: Metadata = {
  title: 'Tabby.ai — Performance Dashboard',
  description: 'Real-time contact center performance tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="antialiased">
        <MetricsProvider>
          {children}
        </MetricsProvider>
      </body>
    </html>
  );
}
