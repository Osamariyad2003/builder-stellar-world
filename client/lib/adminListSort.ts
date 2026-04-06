/**
 * Reusable sorting helpers for admin lists (subjects, batches, etc.).
 */

export type SortDirection = "asc" | "desc";

export type BatchSortField = "name" | "date" | "order";

const getTimeMs = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (value instanceof Date) return value.getTime();
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe.toDate === "function") {
    try {
      return maybe.toDate().getTime();
    } catch {
      return 0;
    }
  }
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
};

const nameCompareOptions: Intl.CollatorOptions = {
  sensitivity: "base",
  numeric: true,
};

/** Sort subjects (or any row with `name`) A–Z / Z–A, with numeric chunks ordered as numbers (e.g. "Part 2" before "Part 10"). */
export const sortByName = <T extends { name?: string }>(
  items: readonly T[],
  direction: SortDirection,
): T[] => {
  const mult = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) =>
    mult *
    String(a.name ?? "").localeCompare(
      String(b.name ?? ""),
      undefined,
      nameCompareOptions,
    ),
  );
};

/** Integer `order` on batch docs; missing / invalid sorts last when ascending. */
export const getBatchOrderValue = (b: { order?: unknown }): number => {
  const o = b.order;
  if (typeof o === "number" && Number.isFinite(o)) return o;
  if (typeof o === "string" && o.trim() !== "") {
    const n = parseInt(o, 10);
    if (!Number.isNaN(n)) return n;
  }
  return Number.MAX_SAFE_INTEGER;
};

const nameTiebreak = (a: { batchName?: string }, b: { batchName?: string }) =>
  String(a.batchName ?? "").localeCompare(
    String(b.batchName ?? ""),
    undefined,
    nameCompareOptions,
  );

/** Batch-like objects: batchName + optional createdAt / graduateDate / integer order. */
export const sortBatches = <
  T extends {
    batchName?: string;
    order?: unknown;
    createdAt?: unknown;
    graduateDate?: string;
    graduate_date?: string;
  },
>(
  batches: readonly T[],
  field: BatchSortField,
  direction: SortDirection,
): T[] => {
  if (field === "name") {
    const mult = direction === "asc" ? 1 : -1;
    return [...batches].sort((a, b) => {
      const cmp =
        mult *
        String(a.batchName ?? "").localeCompare(
          String(b.batchName ?? ""),
          undefined,
          nameCompareOptions,
        );
      if (cmp !== 0) return cmp;
      return getBatchOrderValue(a) - getBatchOrderValue(b);
    });
  }
  if (field === "order") {
    const mult = direction === "asc" ? 1 : -1;
    return [...batches].sort((a, b) => {
      const oa = getBatchOrderValue(a);
      const ob = getBatchOrderValue(b);
      const cmp = mult * (oa - ob);
      if (cmp !== 0) return cmp;
      return nameTiebreak(a, b);
    });
  }
  const mult = direction === "asc" ? 1 : -1;
  return [...batches].sort((a, b) => {
    const ta =
      getTimeMs(a.createdAt) ||
      getTimeMs(a.graduateDate) ||
      getTimeMs(a.graduate_date);
    const tb =
      getTimeMs(b.createdAt) ||
      getTimeMs(b.graduateDate) ||
      getTimeMs(b.graduate_date);
    const cmp = mult * (ta - tb);
    if (cmp !== 0) return cmp;
    return nameTiebreak(a, b);
  });
};
