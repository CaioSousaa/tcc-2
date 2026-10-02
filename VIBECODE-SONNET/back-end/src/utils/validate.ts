import type { ZodType } from "zod";

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  return schema.parse(body ?? {});
}
