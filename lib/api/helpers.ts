/**
 * Helpers for working with the backend's loosely-typed list responses.
 *
 * List endpoints wrap their rows under different keys (`posts`, `changelogs`,
 * `notifications`, `tableData`, ...) and report totals under either `total` or
 * `metadata.totalRows`. These helpers normalize both.
 */

export function extractRows<T>(
  data: unknown,
  key: string
): T[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;

  if (Array.isArray(record[key])) return record[key] as T[];
  if (Array.isArray(record.tableData)) return record.tableData as T[];
  if (Array.isArray(data)) return data as T[];

  return [];
}

export function extractTotal(data: unknown): number {
  if (!data || typeof data !== "object") return 0;
  const record = data as Record<string, unknown>;

  if (typeof record.total === "number") return record.total;

  const metadata = record.metadata as { totalRows?: number } | undefined;
  if (metadata && typeof metadata.totalRows === "number") {
    return metadata.totalRows;
  }

  return extractRows(data, "").length;
}

/** Safely parse a JSON string column (scopes, integration config, metadata). */
export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string") return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
