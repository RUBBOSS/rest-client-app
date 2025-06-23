import { Header } from '@/components/Header';
import HydrationErrorHandler from '@/components/HydrationErrorHandler';
import { Footer } from '@/features/footer/footer';
import { routing } from '@/i18n/routing';
import { AuthenticationProvider } from '@/providers/AuthenticationProvider';
import type { Metadata } from 'next';
import { Locale, NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';

import '../globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicon.png', sizes: '256x256', type: 'image/png' },
      { url: '/favicon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
      { url: '/favicon.png', sizes: '152x152', type: 'image/png' },
      { url: '/favicon.png', sizes: '120x120', type: 'image/png' },
    ],
    other: [
      { url: '/favicon.png', sizes: '192x192', type: 'image/png', rel: 'icon' },
      { url: '/favicon.png', sizes: '512x512', type: 'image/png', rel: 'icon' },
    ],
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <HydrationErrorHandler />
        <NextIntlClientProvider>
          <AuthenticationProvider>
            <div className='relative flex flex-col min-h-screen'>
              <Header />
              <main className='flex-1'>{children}</main>
              <Footer />
            </div>
            <Toaster richColors position='bottom-right' />
          </AuthenticationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
