import type { Request } from "express";
import { Errors } from "../errors";
import { isUuid } from "../ids";

/** Reads a UUID route parameter. A malformed id is a 404, never a 500 (plan §4.1). */
export function idParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!isUuid(value)) throw Errors.notFound();
  return value;
}
