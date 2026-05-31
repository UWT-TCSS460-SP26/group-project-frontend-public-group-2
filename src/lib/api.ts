import "server-only";

import { auth } from "@/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * A typed error for any non-2xx response from Group 1's API.
 *
 * Normalizes both of Group 1's error envelopes:
 *   - ErrorResponse     `{ error, detail? }`              → message / detail
 *   - ZodErrorResponse  `{ errors: { field: string[] } }` → fieldErrors (POST /reviews 400)
 *
 * Thrown by `fetchGroupOneApi`. Server Actions catch it and convert it to an
 * `ActionResult` so the structured fields survive the boundary to the client.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;
  readonly detail?: string;

  constructor(
    message: string,
    status: number,
    options: { fieldErrors?: Record<string, string[]>; detail?: string } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = options.fieldErrors;
    this.detail = options.detail;
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type FetchOptions = {
  /** Defaults to GET (or whatever `init.method` is). */
  method?: HttpMethod;
  query?: Record<string, string | number | undefined>;
  /** JSON-serialized into the request body; sets Content-Type automatically. */
  body?: unknown;
  /** Attach the NextAuth session bearer token. Only works server-side. */
  withAuth?: boolean;
  init?: RequestInit;
};

function firstFieldError(
  fieldErrors: Record<string, string[]>,
): string | undefined {
  for (const messages of Object.values(fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) return messages[0];
  }
  return undefined;
}

async function toApiError(res: Response, pathname: string): Promise<ApiError> {
  let parsed: unknown = null;
  const raw = await res.text().catch(() => "");
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  const record =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;

  // Validate the Zod envelope shape rather than trusting the cast — callers
  // (the review form) branch on these, so a malformed body shouldn't leak through.
  let fieldErrors: Record<string, string[]> | undefined;
  if (record && record.errors && typeof record.errors === "object") {
    const entries = Object.entries(
      record.errors as Record<string, unknown>,
    ).filter(
      ([, value]) =>
        Array.isArray(value) && value.every((m) => typeof m === "string"),
    ) as [string, string[]][];
    if (entries.length > 0) fieldErrors = Object.fromEntries(entries);
  }

  const errorMessage =
    record && typeof record.error === "string" ? record.error : undefined;
  const detail =
    record && typeof record.detail === "string" ? record.detail : undefined;

  const message =
    errorMessage ??
    (fieldErrors && firstFieldError(fieldErrors)) ??
    `Group 1 API ${res.status} ${res.statusText} for ${pathname}`;

  return new ApiError(message, res.status, { fieldErrors, detail });
}

/**
 * Single entry point for every Group 1 API call (reads and writes).
 *
 * - Server components may call this directly and catch `ApiError`.
 * - Client-triggered writes go through the Server Actions in `src/lib/actions/*`,
 *   which call this with `withAuth: true` and convert thrown errors to results.
 *
 * Returns `undefined` (typed as `T`) for 204 / empty responses (e.g. DELETE).
 */
export async function fetchGroupOneApi<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError("NEXT_PUBLIC_API_BASE_URL is not set", 0);
  }

  const { method, query, body, withAuth = false, init = {} } = options;

  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (withAuth) {
    const session = await auth();
    if (session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
    }
  }

  const res = await fetch(url.toString(), {
    ...init,
    method: method ?? init.method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : init.body,
  });

  if (!res.ok) {
    throw await toApiError(res, url.pathname);
  }

  // 204 No Content (e.g. DELETE) — do not attempt to parse a body.
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text.trim()) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(
      `Group 1 API returned a non-JSON 2xx body for ${url.pathname}`,
      res.status,
    );
  }
}
