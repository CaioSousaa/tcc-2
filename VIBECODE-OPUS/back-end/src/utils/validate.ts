import type { ZodType } from "zod";

export function parse<T>(schema: ZodType<T>, data: unknown): T {
  return schema.parse(data);
}
