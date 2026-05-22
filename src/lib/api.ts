import { auth } from "@/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type FetchOptions = {
  query?: Record<string, string | number | undefined>;
  withAuth?: boolean;
  init?: RequestInit;
};

export async function fetchGroupOneApi<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }

  const { query, withAuth = false, init = {} } = options;

  const url = new URL(
    path.startsWith("/") ? path : `/${path}`,
    BASE_URL,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (withAuth) {
    const session = await auth();
    if (session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
    }
  }

  const res = await fetch(url.toString(), { ...init, headers });
  if (!res.ok) {
    throw new Error(
      `Group 1 API ${res.status} ${res.statusText} for ${url.pathname}`,
    );
  }
  return (await res.json()) as T;
}
