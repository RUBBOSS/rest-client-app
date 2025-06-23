'use client';

import { useCallback, useEffect, useState } from 'react';

import { HistoryRecord } from '@/components/HistoryViewer';
import RequestForm from '@/components/RequestForm';
import ResponseDisplay from '@/components/ResponseDisplay';
import { useCodeGenerator } from '@/hooks/useCodeGenerator';
import { Header, Method, ResponseData } from '@/types/types';
import { sendRequest } from '@/utils/rest-client/httpClient';
import { encodeSegment } from '@/utils/rest-client/urlEncoder';
import {
  hasVariables,
  processBody,
  processHeaders,
  processUrl,
} from '@/utils/variables/variableSubstitution';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type RestClientFormClientProps = {
  locale: string;
  initialMethod: string;
  initialUrl: string;
  initialBody: string;
  initialHeaders: Header[];
};

export default function RestClientFormClient({
  locale,
  initialMethod,
  initialUrl,
  initialBody,
  initialHeaders,
}: RestClientFormClientProps) {
  const t = useTranslations();
  const router = useRouter();

  const [url, setUrl] = useState(initialUrl);
  const [method, setMethod] = useState(initialMethod);
  const [requestBody, setRequestBody] = useState(initialBody);
  const [headers, setHeaders] = useState<Header[]>(initialHeaders);
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [contentType, setContentType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingVariables, setUsingVariables] = useState(false);

  useEffect(() => {
    const checkForVariables = () => {
      const urlHasVars = hasVariables(url);
      const bodyHasVars = hasVariables(requestBody);
      const headersHaveVars = headers.some(
        (header) => hasVariables(header.key) || hasVariables(header.value)
      );
      setUsingVariables(urlHasVars || bodyHasVars || headersHaveVars);
    };
    checkForVariables();
  }, [url, requestBody, headers]);

  // Update URL when method changes
  useEffect(() => {
    if (method !== initialMethod) {
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/');
      // Replace the method segment (should be at index 2: /[locale]/[method]/...)
      if (pathSegments.length >= 3) {
        pathSegments[2] = method.toLowerCase();
        const newPath = pathSegments.join('/');
        window.history.replaceState({}, '', newPath);
      }
    }
  }, [method, initialMethod]);

  const {
    selectedLanguage: selectedCodeLanguage,
    setSelectedLanguage: setSelectedCodeLanguage,
    generatedCode,
    isLoading: codeLoading,
  } = useCodeGenerator({
    url,
    method,
    headers,
    contentType,
    body: ['POST', 'PUT', 'PATCH'].includes(method) ? requestBody : undefined,
  });

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setLoading(true);
      setError(null);
      setResponseData(null);

      const saveToHistory = (resolvedUrl?: string) => {
        try {
          const historyRecord: HistoryRecord = {
            id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            url,
            method: method as Method,
            headers,
            body: requestBody,
            contentType,
            timestamp: Date.now(),
            resolvedUrl,
          };
          let history: HistoryRecord[] = [];
          const savedHistory = localStorage.getItem('restClientHistory');
          if (savedHistory) {
            try {
              history = JSON.parse(savedHistory);
              if (!Array.isArray(history)) history = [];
            } catch {
              history = [];
            }
          }
          history.unshift(historyRecord);
          const MAX_HISTORY_ITEMS = 50;
          if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS);
          }
          localStorage.setItem('restClientHistory', JSON.stringify(history));
        } catch {}
      };

      try {
        let processedUrl = url;
        let processedHeaders = [...headers];
        let processedBody = requestBody;

        if (usingVariables) {
          processedUrl = processUrl(url);
          processedHeaders = processHeaders(headers);
          processedBody = processBody(requestBody);
        }

        const effectiveCt = ['POST', 'PUT', 'PATCH'].includes(method) ? contentType : '';

        const response = await sendRequest(
          processedUrl,
          method,
          processedHeaders,
          effectiveCt,
          processedBody
        );
        setResponseData(response);

        saveToHistory(usingVariables ? processedUrl : undefined);

        let urlPath = `/${locale}/${method}`;
        const needsBodyInPath = ['POST', 'PUT', 'PATCH'].includes(method) && requestBody;

        try {
          if (url) {
            urlPath += `/${encodeSegment(url)}`;
            if (needsBodyInPath) {
              urlPath += `/${encodeSegment(requestBody)}`;
            }
          }

          const queryParams = new URLSearchParams();
          headers.forEach((header) => {
            const key = header.key.trim();
            const value = header.value.trim();
            if (key && value) {
              queryParams.append(key, value);
            }
          });

          const queryString = queryParams.toString();
          if (queryString) {
            urlPath += `?${queryString}`;
          }

          window.history.replaceState({}, '', urlPath);
        } catch (encodingError) {
          const message =
            encodingError instanceof Error
              ? encodingError.message
              : t('Notifications.unknownError');
          toast.error(`${t('Notifications.encodingErrorPrefix')}${message}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('Notifications.unknownError');
        toast.error(`${t('Notifications.networkErrorPrefix')}${message}`);
      } finally {
        setLoading(false);
      }
    },
    [url, method, headers, contentType, requestBody, locale, usingVariables, t]
  );

  // Update URL when method changes
  useEffect(() => {
    if (method !== initialMethod) {
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/');
      // Replace the method segment (should be at index 2: /[locale]/[method]/...)
      if (pathSegments.length >= 3) {
        pathSegments[2] = method.toLowerCase();
        const newPath = pathSegments.join('/');
        window.history.replaceState({}, '', newPath);
      }
    }
  }, [method, initialMethod]);

  return (
    <div className='min-h-screen p-4 max-w-5xl mx-auto'>
      <header className='mb-6'>
        {/* Display locale from props */}
        <h1 className='text-2xl font-bold mb-2'>{t('RestClientPage.title', { locale })}</h1>
        {usingVariables && (
          <div className='bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2 mb-4 rounded'>
            <p className='flex items-center'>
              {/* SVG icon */}
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                ></path>
              </svg>
              {/* Use translation key */}
              {t('RestClientPage.variablesNotification')}
            </p>
          </div>
        )}
      </header>

      <RequestForm
        url={url}
        setUrl={setUrl}
        method={method}
        setMethod={setMethod}
        headers={headers}
        setHeaders={setHeaders}
        requestBody={requestBody}
        setRequestBody={setRequestBody}
        contentType={contentType}
        setContentType={setContentType}
        loading={loading}
        onSubmit={handleSubmit}
        generatedCode={generatedCode}
        codeLoading={codeLoading}
        selectedCodeLanguage={selectedCodeLanguage}
        setSelectedCodeLanguage={setSelectedCodeLanguage}
        error={error}
      />

      <ResponseDisplay responseData={responseData} error={null} />
    </div>
  );
}
