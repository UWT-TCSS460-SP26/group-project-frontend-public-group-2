"use server";

import { fetchGroupOneApi } from "@/lib/api";
import type { ActionResult } from "@/types/media";
import { fail, ok } from "./result";

/**
 * POST /users/add-subject-id — sync the JWT `sub` claim onto the local user
 * record. Group 1's `/me` routes resolve the user by subject id, so call this
 * once after sign-in (best-effort; safe to call repeatedly).
 */
export async function syncSubjectId(): Promise<ActionResult<void>> {
  try {
    await fetchGroupOneApi<void>("/users/add-subject-id", {
      method: "POST",
      withAuth: true,
    });
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}
