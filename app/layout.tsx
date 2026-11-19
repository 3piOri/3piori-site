import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://3piori.com'),
  title: '3π Ori — Electronic Music Sessions',
  description: 'Long-form electronic music sessions by 3π Ori.',
  openGraph: {
    type: 'website',
    url: 'https://3piori.com',
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
