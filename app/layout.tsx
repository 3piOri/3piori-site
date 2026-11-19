import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '3π Ori — Electronic Music Sessions', description: 'Long-form electronic music sessions by 3π Ori.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
