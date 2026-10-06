import type { z } from "zod";
import { Errors, type ErrorFields } from "../errors";

interface IssueLike {
  path: readonly PropertyKey[];
  message: string;
}

/** Collapses zod issues into one message per field (first issue wins). */
export function fieldsFromIssues(issues: readonly IssueLike[]): ErrorFields {
  const fields: ErrorFields = {};
  for (const issue of issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

/** Validates external input; throws VALIDATION_ERROR (400) with per-field messages. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    throw Errors.validation(fieldsFromIssues(result.error.issues));
  }
  return result.data;
}
