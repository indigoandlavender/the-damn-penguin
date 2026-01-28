import type { Metadata, Viewport } from 'next';
import { Newsreader, IBM_Plex_Mono, Inter } from 'next/font/google';
import './globals.css';

// =============================================================================
// FONTS — White Editorial Typography System
// =============================================================================

// Display: Sharp, sophisticated Serif for titles and narratives
const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

// Data: Wide-tracked, clinical Monospace for GPS, IDs, percentages
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

// Sans: Clean fallback for UI elements
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

// =============================================================================
// METADATA - PWA Configuration
// =============================================================================

export const metadata: Metadata = {
  title: {
    default: 'The Damn Penguin',
    template: '%s | The Damn Penguin',
  },
  description: 'Digital Investment Gallery — Morocco 2026 Real Estate Intelligence',
  keywords: [
    'real estate investment',
    'morocco property',
    'institutional fund',
    'titre foncier',
    'UHNWI',
    'marrakech investment',
  ],
  authors: [{ name: 'The Damn Penguin' }],
  creator: 'The Damn Penguin',
  publisher: 'The Damn Penguin',
  manifest: '/manifest.json',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['fr_FR', 'ar_MA'],
    siteName: 'The Damn Penguin',
    title: 'The Damn Penguin - Digital Investment Gallery',
    description: 'Curated property intelligence for institutional investors',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#000000' },
    ],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
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
    <html 
      lang="en" 
      className={`${newsreader.variable} ${ibmPlexMono.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Penguin" />
        <link rel="preconnect" href="https://supabase.co" />
        <link rel="dns-prefetch" href="https://supabase.co" />
      </head>
      <body className="min-h-screen bg-white text-black antialiased selection:bg-black selection:text-white">
        {/* Skip to main content - accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-black focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>

        {/* Main application */}
        <main id="main-content" className="relative">
          {children}
        </main>
      </body>
    </html>
  );
}
