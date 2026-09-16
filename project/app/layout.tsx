import '@/app/globals.css';
import { MetricsProvider } from '@/lib/metrics-context';

export const metadata = {
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
      <body>
        <MetricsProvider>
          {children}
        </MetricsProvider>
      </body>
    </html>
  );
}