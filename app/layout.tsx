import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Timer Kontes Kapal Indonesia',
  description: 'Aplikasi Web Timer untuk Kontes Kapal Indonesia (Divisi: ROV, ASV, ERC, FERC, IDK, ISPK)',
  openGraph: {
    title: 'Timer Kontes Kapal Indonesia',
    description: 'Aplikasi Web Timer untuk Kontes Kapal Indonesia (Divisi: ROV, ASV, ERC, FERC, IDK, ISPK)',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Timer Kontes Kapal Indonesia',
    description: 'Aplikasi Web Timer untuk Kontes Kapal Indonesia (Divisi: ROV, ASV, ERC, FERC, IDK, ISPK)',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={inter.className}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
