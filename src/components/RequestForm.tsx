'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { hasVariables } from '@/utils/variables/variableSubstitution';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Header } from '../types/types';

interface RequestFormProps {
  url: string;
  setUrl: (url: string) => void;
  method: string;
  setMethod: (method: string) => void;
  headers: Header[];
  setHeaders: (headers: Header[]) => void;
  requestBody: string;
  setRequestBody: (body: string) => void;
  contentType: string;
  setContentType: (contentType: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  generatedCode: string;
  codeLoading: boolean;
  selectedCodeLanguage: string;
  setSelectedCodeLanguage: (language: string) => void;
  error: string | null;
}

export default function RequestForm({
  url,
  setUrl,
  method,
  setMethod,
  headers,
  setHeaders,
  requestBody,
  setRequestBody,
  contentType,
  setContentType,
  loading,
  onSubmit,
  generatedCode,
  codeLoading,
  selectedCodeLanguage,
  setSelectedCodeLanguage,
  error,
}: RequestFormProps) {
  const t = useTranslations();
  const tNotify = useTranslations('Notifications');

  const addHeader = () => {
    const newId = `header-${Date.now()}`;
    setHeaders([...headers, { id: newId, key: '', value: '' }]);
  };

  const updateHeader = (id: string, field: 'key' | 'value', value: string) => {
    setHeaders(
      headers.map((header) => (header.id === id ? { ...header, [field]: value } : header))
    );
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter((header) => header.id !== id));
  };

  const formatRequestBody = () => {
    if (contentType.includes('json') && requestBody) {
      try {
        const parsed = JSON.parse(requestBody);
        setRequestBody(JSON.stringify(parsed, null, 2));
      } catch (e) {
        const message = e instanceof Error ? e.message : tNotify('invalidJsonError');
        toast.error(message);
      }
    }
  };

  const isTranslationKey = (code: string) => {
    return code.startsWith('CodeGenerator.');
  };

  return (
    <form onSubmit={onSubmit} className='mb-6 border rounded-md p-4 space-y-4'>
      {/* --- URL and Method --- */}
      <div className='flex flex-col sm:flex-row items-center gap-2'>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className='w-full sm:w-[120px]'>
            <SelectValue placeholder='Method' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='GET'>GET</SelectItem>
            <SelectItem value='POST'>POST</SelectItem>
            <SelectItem value='PUT'>PUT</SelectItem>
            <SelectItem value='PATCH'>PATCH</SelectItem>
            <SelectItem value='DELETE'>DELETE</SelectItem>
            <SelectItem value='OPTIONS'>OPTIONS</SelectItem>
            <SelectItem value='HEAD'>HEAD</SelectItem>
          </SelectContent>
        </Select>{' '}
        <Input
          type='text'
          placeholder={t('RequestForm.urlPlaceholder')}
          className='flex-1'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />{' '}
        <Button type='submit' disabled={loading || (!url.trim() && !hasVariables(url))}>
          {loading ? t('RequestForm.sendingButton') : t('RequestForm.sendButton')}
        </Button>
      </div>

      {/* --- Headers --- */}
      <div className='space-y-2'>
        <div className='flex justify-between items-center'>
          <Label className='font-medium'>{t('RequestForm.headersLabel')}</Label>
          <Button type='button' size='sm' variant='outline' onClick={addHeader}>
            {t('RequestForm.addHeaderButton')}
          </Button>
        </div>
        {headers.length > 0 ? (
          headers.map((header) => (
            <div key={header.id} className='flex gap-2 items-center'>
              <Input
                type='text'
                placeholder={t('RequestForm.keyPlaceholder')}
                className='flex-1'
                value={header.key}
                onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
              />
              <Input
                type='text'
                placeholder={t('RequestForm.valuePlaceholder')}
                className='flex-1'
                value={header.value}
                onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='text-red-500 hover:bg-red-100'
                onClick={() => removeHeader(header.id)}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='lucide lucide-trash-2'
                >
                  <path d='M3 6h18' />
                  <path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' />
                  <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' />
                  <line x1='10' x2='10' y1='11' y2='17' />
                  <line x1='14' x2='14' y1='11' y2='17' />
                </svg>
                <span className='sr-only'>{t('RequestForm.removeButton')}</span>
              </Button>
            </div>
          ))
        ) : (
          <div className='text-gray-500 text-sm'>{t('RequestForm.noHeaders')}</div>
        )}
      </div>

      {/* --- Code Snippet --- */}
      <div className='space-y-2'>
        <div className='flex justify-between items-center'>
          <Label className='font-medium'>{t('RequestForm.codeLabel')}</Label>
          <Select value={selectedCodeLanguage} onValueChange={setSelectedCodeLanguage}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Select Language' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='curl'>cURL</SelectItem>
              <SelectItem value='fetch'>JavaScript (Fetch)</SelectItem>
              <SelectItem value='xhr'>JavaScript (XHR)</SelectItem>
              <SelectItem value='nodejs'>Node.js</SelectItem>
              <SelectItem value='python'>Python</SelectItem>
              <SelectItem value='java'>Java</SelectItem>
              <SelectItem value='csharp'>C#</SelectItem>
              <SelectItem value='go'>Go</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <pre className='border p-3 rounded bg-gray-100 dark:bg-gray-800 text-sm overflow-auto max-h-40 min-h-40 font-mono'>
          {/* Translate generatedCode if it's a known key */}
          {codeLoading
            ? t('RequestForm.generatingCode')
            : isTranslationKey(generatedCode)
              ? t(generatedCode)
              : generatedCode}
        </pre>
      </div>

      {/* --- Body --- */}
      {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
        <div className='space-y-2'>
          <div className='flex justify-between items-center'>
            <div className='flex gap-2 items-center'>
              <Label className='font-medium'>{t('RequestForm.bodyLabel')}</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Content Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='application/json'>JSON</SelectItem>
                  <SelectItem value='text/plain'>Plain Text</SelectItem>
                  {/* Add other content types if needed */}
                </SelectContent>
              </Select>
            </div>
            {contentType.includes('json') && requestBody && (
              <Button type='button' variant='outline' size='sm' onClick={formatRequestBody}>
                {t('RequestForm.prettifyButton')}
              </Button>
            )}
          </div>
          <Textarea
            className='w-full h-40 font-mono text-sm'
            value={requestBody}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestBody(e.target.value)}
            placeholder={
              contentType.includes('json')
                ? `{\n  "key": "value"\n}`
                : t('RequestForm.bodyPlaceholderText')
            }
          />
        </div>
      )}

      {/* --- Error Display --- */}
      {error && (
        <div className='bg-red-100 border-red-400 border p-3 rounded text-red-700 text-sm'>
          {error} {/* Keep displaying validation errors passed via props */}
        </div>
      )}
    </form>
  );
}
