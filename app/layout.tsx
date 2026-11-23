import type { Metadata } from 'next';
import './globals.css';
import './legal.css';

const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (deploymentHost ? `https://${deploymentHost}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '3π Ori — Electronic Music Sessions',
  description: 'Long-form electronic music sessions by 3π Ori.',
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: '3π Ori — Electronic Music Sessions',
    description: 'Long-form electronic music sessions by 3π Ori.',
    siteName: '3π Ori',
    images: [
      {
        url: '/Ori.png',
        width: 1536,
        height: 1024,
        alt: '3π Ori',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3π Ori — Electronic Music Sessions',
    description: 'Long-form electronic music sessions by 3π Ori.',
    images: ['/Ori.png'],
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
