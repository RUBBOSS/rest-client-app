import React from 'react';

import RequestForm from '@/components/RequestForm';
import { Header } from '@/types/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: { error: jest.fn() },
}));

const mockSelectOnValueChange = jest.fn();
jest.mock('@/components/ui/select', () => {
  return {
    Select: ({
      children,
      onValueChange,
      value,
    }: {
      children: React.ReactNode;
      onValueChange?: (value: string) => void;
      value?: string;
    }) => {
      React.useEffect(() => {
        if (onValueChange) {
          mockSelectOnValueChange.mockImplementation((val) => onValueChange(val));
        }
      }, [onValueChange]);
      return (
        <div data-testid='mock-select' data-value={value}>
          {children}
        </div>
      );
    },
    SelectTrigger: ({ className, children }: { className?: string; children: React.ReactNode }) => (
      <button
        role='combobox'
        aria-controls='radix-:r0:'
        aria-expanded='false'
        className={className}
      >
        {children}
      </button>
    ),
    SelectValue: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock next-intl translations
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'RequestForm.urlPlaceholder': 'Enter endpoint URL',
      'RequestForm.sendButton': 'Send',
      'RequestForm.sendingButton': 'Sending...',
      'RequestForm.headersLabel': 'Headers',
      'RequestForm.noHeaders': 'No headers added',
      'RequestForm.codeLabel': 'Code',
      'RequestForm.bodyLabel': 'Body',
      'RequestForm.generatingCode': 'Generating code...',
      'RequestForm.addHeaderButton': 'Add Header',
      'RequestForm.removeButton': 'Remove',
      'RequestForm.keyPlaceholder': 'Key',
      'RequestForm.valuePlaceholder': 'Value',
      'RequestForm.prettifyButton': 'Prettify',
      'Notifications.invalidJsonError': 'Invalid JSON format',
    };
    return translations[key] || key;
  },
}));

describe('RequestForm Component', () => {
  const mockProps = {
    url: 'https://api.example.com/v1/users',
    setUrl: jest.fn(),
    method: 'GET',
    setMethod: jest.fn(),
    headers: [] as Header[],
    setHeaders: jest.fn(),
    requestBody: '',
    setRequestBody: jest.fn(),
    contentType: 'application/json',
    setContentType: jest.fn(),
    loading: false,
    onSubmit: jest.fn().mockImplementation((e) => {
      e.preventDefault();
      return Promise.resolve();
    }),
    generatedCode: 'curl example.com',
    codeLoading: false,
    selectedCodeLanguage: 'curl',
    setSelectedCodeLanguage: jest.fn(),
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    console.error = console.error;
  });

  test('renders the form with initial values', () => {
    render(<RequestForm {...mockProps} />);

    // Just check if the method value is passed to the component correctly
    const selectElement = document.querySelector('[data-testid="mock-select"]');
    expect(selectElement).toHaveAttribute('data-value', 'GET');

    expect(screen.getByPlaceholderText('Enter endpoint URL')).toHaveValue(
      'https://api.example.com/v1/users'
    );
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    expect(screen.getByText('Headers')).toBeInTheDocument();
    expect(screen.getByText('No headers added')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('curl example.com')).toBeInTheDocument();
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
  });

  test('shows loading state when loading prop is true', () => {
    render(<RequestForm {...mockProps} loading={true} />);

    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
  });

  test('shows code loading state', () => {
    render(<RequestForm {...mockProps} codeLoading={true} />);

    expect(screen.getByText('Generating code...')).toBeInTheDocument();
  });

  test('shows error message when error prop is provided', () => {
    const error = 'Invalid request';
    render(<RequestForm {...mockProps} error={error} />);

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  test('updates URL when input changes', () => {
    render(<RequestForm {...mockProps} />);

    const input = screen.getByPlaceholderText('Enter endpoint URL');
    fireEvent.change(input, { target: { value: 'https://api.example.com/v2/users' } });

    expect(mockProps.setUrl).toHaveBeenCalledWith('https://api.example.com/v2/users');
  });

  test('adds a new header when "Add Header" button is clicked', () => {
    const { rerender } = render(<RequestForm {...mockProps} />);

    const addButton = screen.getByRole('button', { name: 'Add Header' });
    fireEvent.click(addButton);

    expect(mockProps.setHeaders).toHaveBeenCalled();
    const call = mockProps.setHeaders.mock.calls[0][0];
    expect(call).toHaveLength(1);
    expect(call[0]).toHaveProperty('id');
    expect(call[0].key).toBe('');
    expect(call[0].value).toBe('');

    const headers = [{ id: 'header-1', key: '', value: '' }];
    rerender(<RequestForm {...mockProps} headers={headers} />);

    expect(screen.queryByText('No headers added')).not.toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Key')).toHaveLength(1);
    expect(screen.getAllByPlaceholderText('Value')).toHaveLength(1);
  });

  test('updates header when input changes', () => {
    const headers = [{ id: 'header-1', key: '', value: '' }];
    render(<RequestForm {...mockProps} headers={headers} />);

    const keyInput = screen.getByPlaceholderText('Key');
    const valueInput = screen.getByPlaceholderText('Value');

    fireEvent.change(keyInput, { target: { value: 'Content-Type' } });
    expect(mockProps.setHeaders).toHaveBeenCalledWith([
      { id: 'header-1', key: 'Content-Type', value: '' },
    ]);

    fireEvent.change(valueInput, { target: { value: 'application/json' } });
    expect(mockProps.setHeaders).toHaveBeenCalledWith([
      { id: 'header-1', key: '', value: 'application/json' },
    ]);
  });

  test('removes header when Remove button is clicked', () => {
    const headers = [{ id: 'header-1', key: 'Content-Type', value: 'application/json' }];
    render(<RequestForm {...mockProps} headers={headers} />);

    const removeButton = screen.getByRole('button', { name: 'Remove' });
    fireEvent.click(removeButton);

    expect(mockProps.setHeaders).toHaveBeenCalledWith([]);
  });

  test('shows request body section for POST method', () => {
    render(<RequestForm {...mockProps} method='POST' />);

    expect(screen.getByText('Body')).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText(/{\s*"key": "value"\s*}/);
    expect(textarea).toBeInTheDocument();
  });

  test('shows request body section for PUT method', () => {
    render(<RequestForm {...mockProps} method='PUT' />);

    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/{\s*"key": "value"\s*}/)).toBeInTheDocument();
  });

  test('updates request body when textarea changes', () => {
    render(<RequestForm {...mockProps} method='POST' />);

    const textarea = screen.getByPlaceholderText(/{\s*"key": "value"\s*}/);
    fireEvent.change(textarea, { target: { value: '{"name": "John"}' } });

    expect(mockProps.setRequestBody).toHaveBeenCalledWith('{"name": "John"}');
  });

  test('updates content type when dropdown changes', () => {
    render(<RequestForm {...mockProps} method='POST' />);

    mockSelectOnValueChange('text/plain');
    expect(mockProps.setContentType).toHaveBeenCalledWith('text/plain');
  });

  test('updates code language when dropdown changes', () => {
    render(<RequestForm {...mockProps} />);

    mockSelectOnValueChange('python');
    expect(mockProps.setSelectedCodeLanguage).toHaveBeenCalledWith('python');
  });

  test('submits the form', async () => {
    render(<RequestForm {...mockProps} />);

    const form = screen.getByPlaceholderText('Enter endpoint URL').closest('form');
    fireEvent.submit(form!);

    expect(mockProps.onSubmit).toHaveBeenCalled();
  });

  test('prettifies JSON when format button is clicked', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<RequestForm {...mockProps} method='POST' requestBody='{"name":"John","age":30}' />);

    const formatButton = screen.getByRole('button', { name: 'Prettify' });
    fireEvent.click(formatButton);

    const expectedFormattedJson = JSON.stringify({ name: 'John', age: 30 }, null, 2);
    expect(mockProps.setRequestBody).toHaveBeenCalledWith(expectedFormattedJson);

    consoleErrorSpy.mockRestore();
  });

  test('handles invalid JSON when prettifying', () => {
    const invalidJson = '{"name":"John", invalid json';

    render(<RequestForm {...mockProps} method='POST' requestBody={invalidJson} />);

    const formatButton = screen.getByRole('button', { name: 'Prettify' });
    fireEvent.click(formatButton);

    expect(toast.error).toHaveBeenCalledWith(expect.any(String));
    expect(mockProps.setRequestBody).not.toHaveBeenCalled();
  });
});
