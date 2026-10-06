interface PgErrorLike {
  driverError?: { code?: string; constraint?: string };
}

/** True when a TypeORM/pg error is a unique-constraint violation (SQLSTATE 23505). */
export function isUniqueViolation(error: unknown): boolean {
  return (error as PgErrorLike | null)?.driverError?.code === "23505";
}

/** Name of the violated constraint, when the driver reports one. */
export function violatedConstraint(error: unknown): string | undefined {
  return (error as PgErrorLike | null)?.driverError?.constraint;
}
