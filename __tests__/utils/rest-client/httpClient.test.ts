import { Header } from '@/types/types';
import { sendRequest } from '@/utils/rest-client/httpClient';

global.fetch = jest.fn();

global.TextEncoder = class {
  encode() {
    return new Uint8Array(10);
  }
  encodeInto(source: string, destination: Uint8Array) {
    return { read: source.length, written: destination.length };
  }
  get encoding() {
    return 'utf-8';
  }
};

describe('HTTP Client Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendRequest function', () => {
    test('should send a GET request correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        text: jest.fn().mockResolvedValue(JSON.stringify({ data: 'test' })),
      });

      const headers: Header[] = [{ id: '1', key: 'Authorization', value: 'Bearer token123' }];

      const response = await sendRequest(
        'https://api.example.com/data',
        'GET',
        headers,
        '',
        undefined
      );

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.parsedBody).toEqual({ data: 'test' });
      expect(response.headers).toEqual({ 'content-type': 'application/json' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: 'Bearer token123',
          },
        })
      );
    });

    test('should send a POST request with body correctly', async () => {
      const requestBody = JSON.stringify({ name: 'test' });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        text: jest.fn().mockResolvedValue(JSON.stringify({ id: 1 })),
      });

      const headers: Header[] = [{ id: '1', key: 'Content-Type', value: 'application/json' }];

      const response = await sendRequest(
        'https://api.example.com/items',
        'POST',
        headers,
        'application/json',
        requestBody
      );

      expect(response.status).toBe(201);
      expect(response.parsedBody).toEqual({ id: 1 });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/items',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        })
      );
    });

    test('should handle non-JSON responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'text/plain',
        }),
        text: jest.fn().mockResolvedValue('Plain text response'),
      });

      const response = await sendRequest('https://api.example.com/text', 'GET', [], '', undefined);

      expect(response.status).toBe(200);
      expect(response.body).toBe('Plain text response');
    });

    test('should handle empty responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers({}),
        text: jest.fn().mockResolvedValue(''),
      });

      const response = await sendRequest(
        'https://api.example.com/empty',
        'DELETE',
        [],
        '',
        undefined
      );

      expect(response.status).toBe(204);
      expect(response.body).toBe('[Binary data not displayed]');
      expect(response.parsedBody).toBeNull();
    });

    test('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      try {
        await sendRequest('https://api.example.com/error', 'GET', [], '', undefined);
        fail('Expected error was not thrown');
      } catch (error) {
        expect((error as Error).message).toContain('Network error');
      }
    });

    test('should handle HTTP errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'Not found' })),
      });

      const response = await sendRequest(
        'https://api.example.com/nonexistent',
        'GET',
        [],
        '',
        undefined
      );

      expect(response.status).toBe(404);
      expect(response.statusText).toBe('Not Found');
      expect(response.parsedBody).toEqual({ error: 'Not found' });
    });

    test('should send a PUT request correctly', async () => {
      const requestBody = JSON.stringify({ id: 1, name: 'updated' });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        text: jest.fn().mockResolvedValue(JSON.stringify({ id: 1, name: 'updated' })),
      });

      const headers: Header[] = [{ id: '1', key: 'Content-Type', value: 'application/json' }];

      const response = await sendRequest(
        'https://api.example.com/items/1',
        'PUT',
        headers,
        'application/json',
        requestBody
      );

      expect(response.status).toBe(200);
      expect(response.parsedBody).toEqual({ id: 1, name: 'updated' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        })
      );
    });

    test('should send a PATCH request correctly', async () => {
      const requestBody = JSON.stringify({ name: 'patched' });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        text: jest.fn().mockResolvedValue(JSON.stringify({ id: 1, name: 'patched' })),
      });

      const headers: Header[] = [{ id: '1', key: 'Content-Type', value: 'application/json' }];

      const response = await sendRequest(
        'https://api.example.com/items/1',
        'PATCH',
        headers,
        'application/json',
        requestBody
      );

      expect(response.status).toBe(200);
      expect(response.parsedBody).toEqual({ id: 1, name: 'patched' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        })
      );
    });
  });
});
