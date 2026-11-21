import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Gheptix.id — Platform Tiket Konser Resmi',
  description: 'Pesan tiket konser musik favoritmu dengan mudah dan aman di Gheptix.id.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${plusJakartaSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
