'use client';

import { useEffect, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@/i18n/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import {
  historyPath,
  homePath,
  restClientPath,
  signInPath,
  signUpPath,
  variablesPath,
} from '@/paths';
import { useAuth } from '@/providers/AuthenticationProvider';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

import { SignOutButton } from './SignOutButton';
import { Button } from './ui/button';

export function Header() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const t = useTranslations('header');
  const router = useRouter();
  const pathname = usePathname();
  const [isLocaleLoading, setIsLocaleLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const currentLocale = useLocale();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale || isLocaleLoading) return;

    setIsLocaleLoading(true);

    router.replace(pathname, { locale: newLocale });
  };

  useEffect(() => {
    if (isLocaleLoading) {
      setIsLocaleLoading(false);
    }
  }, [currentLocale, isLocaleLoading]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLoading = isAuthLoading || isLocaleLoading;

  // Check if current path is a REST client route (accounting for locale prefix)
  const isRestClientRoute = () => {
    const pathSegments = pathname.split('/');
    // URL structure: /{locale}/{method}/... (e.g., /en/GET/...)
    if (pathSegments.length >= 3) {
      const method = pathSegments[2].toUpperCase();
      return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].includes(method);
    }
    return false;
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-all duration-300 ease-in-out',
        isScrolled
          ? 'bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm'
          : 'bg-background'
      )}
    >
      <div
        className={cn(
          'container flex items-center transition-all duration-300 ease-in-out',
          isScrolled ? 'h-14' : 'h-16'
        )}
      >
        <div className='mr-4 hidden pl-4 md:flex'>
          <Link href={homePath()} className='mr-6 flex items-center space-x-2'>
            <span className='hidden font-bold sm:inline-block'>{t('title')}</span>
          </Link>
          {isAuthenticated && (
            <nav className='flex items-center space-x-6 text-sm font-medium'>
              <Link
                href={homePath()}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname === homePath() ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {t('nav.home')}
              </Link>
              <Link
                href={restClientPath()}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  isRestClientRoute() ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {t('nav.restClient')}
              </Link>
              <Link
                href={variablesPath()}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname === variablesPath() ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {t('nav.variables')}
              </Link>
              <Link
                href={historyPath()}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname === historyPath() ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {t('nav.history')}
              </Link>
            </nav>
          )}
        </div>
        <div className='flex flex-1 items-center justify-end space-x-2'>
          <nav className='ml-auto flex items-center'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm' disabled={isLoading}>
                  {isLocaleLoading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    t(`language.${currentLocale}`)
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {routing.locales.map((locale) => (
                  <DropdownMenuItem
                    key={locale}
                    onClick={() => handleLocaleChange(locale as string)}
                    disabled={currentLocale === locale || isLoading}
                  >
                    {t(`language.${locale}`)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
          {!isAuthenticated ? (
            <div className='flex items-center space-x-2'>
              <Button variant='ghost' size='sm' asChild>
                <Link href={signInPath()}>{t('nav.signIn')}</Link>
              </Button>
              <Button size='sm' asChild>
                <Link href={signUpPath()}>{t('nav.signUp')}</Link>
              </Button>
            </div>
          ) : (
            <SignOutButton />
          )}
        </div>
      </div>
    </header>
  );
}
