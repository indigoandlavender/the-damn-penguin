import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// =============================================================================
// FONTS
// =============================================================================

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// =============================================================================
// METADATA - PWA Configuration
// =============================================================================

export const metadata: Metadata = {
  title: {
    default: 'The Damn Penguin',
    template: '%s | The Damn Penguin',
  },
  description: 'Institutional Real Estate Intelligence Platform - Morocco 2026',
  keywords: [
    'real estate',
    'morocco',
    'investment',
    'riad',
    'marrakech',
    'property',
    'titre foncier',
    'melkia',
  ],
  authors: [{ name: 'The Damn Penguin Team' }],
  creator: 'The Damn Penguin',
  publisher: 'The Damn Penguin',

  // PWA Manifest
  manifest: '/manifest.json',

  // App configuration
  applicationName: 'The Damn Penguin',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Penguin',
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['fr_FR', 'ar_MA'],
    siteName: 'The Damn Penguin',
    title: 'The Damn Penguin - Real Estate Intelligence',
    description: 'Convert raw property data into audited, bankable investment dossiers',
  },

  // Icons
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#0f172a' },
    ],
  },

  // Robots
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// =============================================================================
// ROOT LAYOUT
// =============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Penguin" />

        {/* Splash Screens for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048-2732.jpg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1170-2532.jpg"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1125-2436.jpg"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* Preconnect to Supabase */}
        <link rel="preconnect" href="https://supabase.co" />
        <link rel="dns-prefetch" href="https://supabase.co" />
      </head>
      <body
        className={`
          min-h-screen bg-slate-50 font-sans antialiased
          selection:bg-slate-900 selection:text-white
        `}
      >
        {/* Skip to main content - accessibility */}
        <a
          href="#main-content"
          className="
            sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4
            focus:z-50 focus:rounded-md focus:bg-slate-900 focus:px-4 focus:py-2
            focus:text-white focus:outline-none
          "
        >
          Skip to main content
        </a>

        {/* Main application */}
        <main id="main-content" className="relative">
          {children}
        </main>

        {/* Offline indicator - will be enhanced by service worker */}
        <div
          id="offline-indicator"
          className="
            fixed bottom-4 left-1/2 z-50 hidden -translate-x-1/2
            rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white
            shadow-lg
          "
          role="status"
          aria-live="polite"
        >
          Offline Mode Active
        </div>
      </body>
    </html>
  );
}
