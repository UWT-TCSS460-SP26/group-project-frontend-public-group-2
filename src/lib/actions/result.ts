import "server-only";

import { ApiError } from "@/lib/api";
import type { ActionError, ActionResult } from "@/types/media";

// Plain helpers (NOT a "use server" module) shared by the action files. They
// normalize thrown errors into the ActionResult envelope so structured fields
// (status, fieldErrors) survive the Server Action → client boundary.

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: unknown): { ok: false; error: ActionError } {
  if (error instanceof ApiError) {
    return {
      ok: false,
      error: {
        status: error.status,
        message: error.message,
        detail: error.detail,
        fieldErrors: error.fieldErrors,
      },
    };
  }
  return {
    ok: false,
    error: {
      status: 0,
      message: error instanceof Error ? error.message : "Unexpected error",
    },
  };
}
