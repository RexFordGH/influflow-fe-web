import '../styles/globals.css';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { MainLayout } from '@/components/layout/mainLayout';
import { Providers } from '@/components/layout/providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script async src="https://platform.twitter.com/widgets.js"></script>
      </head>
      <body className="font-poppins">
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
