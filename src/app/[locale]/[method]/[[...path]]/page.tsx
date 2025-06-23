import { Header } from '@/types/types';
import { decodeSegment } from '@/utils/rest-client/urlEncoder';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import RestClientFormClient from './RestClientFormClient';

type ResolvedParams = {
  locale: string;
  method: string;
  path?: string[];
};

type ResolvedSearchParams = {
  [key: string]: string | string[] | undefined;
};

function checkMethodValidity(method?: string): boolean {
  if (typeof method !== 'string') {
    return false;
  }

  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(
    method.toUpperCase()
  );
}

function isValidUrl(urlSegment: string): boolean {
  // If the segment looks like a random string (no dots, no protocols, just random chars)
  // and is not a valid URL pattern, consider it invalid
  if (!urlSegment) return false;

  // Allow URLs that start with http/https
  if (urlSegment.startsWith('http://') || urlSegment.startsWith('https://')) {
    return true;
  }

  // Allow URLs that look like domains (contain dots)
  if (urlSegment.includes('.')) {
    return true;
  }

  // Allow localhost patterns
  if (urlSegment.startsWith('localhost')) {
    return true;
  }

  // Allow IP patterns (simple check)
  if (/^\d+\.\d+\.\d+\.\d+/.test(urlSegment)) {
    return true;
  }

  // Allow paths that start with /
  if (urlSegment.startsWith('/')) {
    return true;
  }

  // If it's just random alphabetic characters without URL structure, consider it invalid
  // But only if it's longer than 8 chars and contains no numbers or special chars
  if (/^[a-zA-Z]+$/.test(urlSegment) && urlSegment.length > 8 && !/[0-9\-_]/.test(urlSegment)) {
    return false;
  }

  return true;
}

export default async function RestClientPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<ResolvedParams>;
  searchParams: Promise<ResolvedSearchParams>;
}) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;

  const initialMethod = params.method.toUpperCase();
  const path = params.path;
  const locale = params.locale;
  setRequestLocale(locale);

  if (!checkMethodValidity(initialMethod)) {
    notFound();
  }

  let initialEncodedUrl: string | undefined = undefined;
  let initialEncodedBody: string | undefined = undefined;

  if (path) {
    if (path.length >= 1) {
      initialEncodedUrl = path[0];

      // Validate if the URL segment looks valid
      try {
        const decodedUrl = decodeSegment(initialEncodedUrl);
        if (!isValidUrl(decodedUrl)) {
          notFound();
        }
      } catch {
        // If decoding fails, it's likely an invalid URL
        notFound();
      }
    }
    if (path.length >= 2 && ['POST', 'PUT', 'PATCH'].includes(initialMethod)) {
      initialEncodedBody = path[1];
    }
  }

  let initialDecodedUrl = '';
  if (initialEncodedUrl) {
    try {
      initialDecodedUrl = decodeSegment(initialEncodedUrl);
    } catch (err) {
      throw err;
    }
  }

  let initialDecodedBody = '';
  if (initialEncodedBody) {
    try {
      initialDecodedBody = decodeSegment(initialEncodedBody);
    } catch (err) {
      throw err;
    }
  }

  const initialHeaders: Header[] = [];
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      initialHeaders.push({
        id: `header-initial-${key}`,
        key: key,
        value: value,
      });
    }
  }

  return (
    <RestClientFormClient
      locale={locale}
      initialMethod={initialMethod}
      initialUrl={initialDecodedUrl}
      initialBody={initialDecodedBody}
      initialHeaders={initialHeaders}
    />
  );
}
