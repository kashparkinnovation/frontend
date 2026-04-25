import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import ImpersonationBanner from '@/components/ui/ImpersonationBanner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    template: '%s | eSchoolKart',
    default: 'eSchoolKart — School Uniform Ordering System',
  },
  description:
    'eSchoolKart.com — The premier multi-vendor school uniform ordering platform connecting schools, vendors, and parents.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <ImpersonationBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
