/**
 * Extracts the violating field names from a Prisma P2002 (unique constraint) error.
 *
 * Prisma exposes the fields in two different locations depending on whether a
 * native engine or a driver-adapter (e.g. @prisma/adapter-pg) is used:
 *   - Native engine  : err.meta.target          (string[])
 *   - Driver adapter : err.meta.driverAdapterError.cause.constraint.fields  (string[])
 *
 * This helper checks both paths so callers never have to care which engine is active.
 */
export function getPrismaConstraintFields(err: unknown): string[] {
  const e = err as any;
  if (Array.isArray(e?.meta?.target)) return e.meta.target;
  if (Array.isArray(e?.meta?.driverAdapterError?.cause?.constraint?.fields)) {
    return e.meta.driverAdapterError.cause.constraint.fields;
  }
  return [];
}
