// Simple API client with base URL, timeout, and error handling

export interface ApiClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

function buildUrl(baseUrl: string | undefined, path: string): string {
  const normalizedBase = (baseUrl || '').replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? (import.meta as any).env?.VITE_API_BASE_URL ?? '';
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.defaultHeaders || {}),
  };
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function request<T>(path: string, init: RequestInit & { query?: Record<string, string | number | boolean | undefined> } = {}): Promise<T> {
    const { query, headers, ...rest } = init;
    let url = buildUrl(baseUrl, path);
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.append(k, String(v));
      });
      url += `?${params.toString()}`;
    }
    const resp = await withTimeout(fetch(url, {
      ...rest,
      headers: { ...defaultHeaders, ...(headers || {}) },
    }), timeoutMs);

    const contentType = resp.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await resp.json().catch(() => undefined) : await resp.text();
    if (!resp.ok) {
      throw new ApiError(`Request failed with status ${resp.status}`, resp.status, data);
    }
    return data as T;
  }

  return {
    get: <T>(path: string, init?: RequestInit & { query?: Record<string, string | number | boolean | undefined> }) => request<T>(path, { method: 'GET', ...(init || {}) }),
    post: <T>(path: string, body?: unknown, init?: RequestInit & { query?: Record<string, string | number | boolean | undefined> }) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body), ...(init || {}) }),
    put: <T>(path: string, body?: unknown, init?: RequestInit & { query?: Record<string, string | number | boolean | undefined> }) => request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body), ...(init || {}) }),
    patch: <T>(path: string, body?: unknown, init?: RequestInit & { query?: Record<string, string | number | boolean | undefined> }) => request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body), ...(init || {}) }),
    delete: <T>(path: string, init?: RequestInit & { query?: Record<string, string | number | boolean | undefined> }) => request<T>(path, { method: 'DELETE', ...(init || {}) }),
    buildUrl: (path: string) => buildUrl(baseUrl, path),
  };
}

export const api = createApiClient();



