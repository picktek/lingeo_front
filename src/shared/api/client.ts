export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response: Response,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 401 && window.location.pathname !== '/login') {
    window.location.assign('/login');
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status, response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function apiGet<T>(path: string, params?: URLSearchParams): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);

  if (params) {
    params.forEach((value, key) => url.searchParams.set(key, value));
  }

  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: JsonBody): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return parseResponse<T>(response);
}
