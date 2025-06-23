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

  return true;
}

function isValidEncodedUrl(encodedSegment: string): boolean {
  // Check if the segment looks like a properly encoded URL
  // If it's just random characters without proper encoding structure, reject it

  // Check if it looks like base64 (only contains valid base64 characters)
  const base64Pattern = /^[A-Za-z0-9\-_]+$/;
  if (!base64Pattern.test(encodedSegment)) {
    return false;
  }

  // If it's just a few random letters (likely not a real encoded URL), reject it
  if (/^[a-zA-Z]{3,8}$/.test(encodedSegment)) {
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

      // First validate if the encoded segment looks valid
      if (!isValidEncodedUrl(initialEncodedUrl)) {
        notFound();
      }

      // Then try to decode and validate the decoded URL
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
