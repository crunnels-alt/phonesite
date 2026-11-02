import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

// Shipped in the repo so builds don't depend on reaching Google Fonts. Variable font, licensed under the OFL (fonts/OFL.txt).
const spaceGrotesk = localFont({
  src: './fonts/SpaceGrotesk-latin.woff2',
  variable: '--font-space-grotesk',
  weight: '300 500',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Connor Runnels',
  description: 'Personal site you can navigate by phone. Call +1 415 680 9353.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} bg-background`}>
      <body className="bg-background font-sans text-ink antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
