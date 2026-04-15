import { eb } from './eurobase';

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? 'https://forestdream-api.eurobase.app';

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await eb.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeaders()),
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}
