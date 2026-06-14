"use client";

export type SortDirection = "asc" | "desc";

export type SortConfig<TSortKey extends string> = {
  key: TSortKey;
  direction: SortDirection;
} | null;

/**
 * 1er clic : tri croissant, 2e clic : tri décroissant, 3e clic : retour à l'ordre initial.
 */
export function toggleSort<TSortKey extends string>(
  currentSort: SortConfig<TSortKey>,
  key: TSortKey
): SortConfig<TSortKey> {
  if (!currentSort || currentSort.key !== key) {
    return { key, direction: "asc" };
  }

  if (currentSort.direction === "asc") {
    return { key, direction: "desc" };
  }

  return null;
}

type SortValue = string | number | null | undefined;

function isEmptyValue(value: SortValue): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && Number.isNaN(value))
  );
}

/**
 * Retourne une copie triée du tableau, sans jamais muter `rows`.
 * Les valeurs vides (null/undefined/NaN) sont toujours envoyées en bas,
 * et le tri reste stable grâce à l'index initial en cas d'égalité.
 */
export function sortRows<TRow, TSortKey extends string>(
  rows: TRow[],
  sortConfig: SortConfig<TSortKey>,
  getValue: (row: TRow, key: TSortKey) => SortValue
): TRow[] {
  if (!sortConfig) return [...rows];

  const { key, direction } = sortConfig;

  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const va = getValue(a.row, key);
      const vb = getValue(b.row, key);

      const aEmpty = isEmptyValue(va);
      const bEmpty = isEmptyValue(vb);

      if (aEmpty && bEmpty) return a.index - b.index;
      if (aEmpty) return 1;
      if (bEmpty) return -1;

      let comparison: number;

      if (typeof va === "number" && typeof vb === "number") {
        comparison = va - vb;
      } else {
        comparison = String(va).localeCompare(String(vb), "fr", {
          sensitivity: "base",
        });
      }

      if (comparison === 0) return a.index - b.index;

      return direction === "asc" ? comparison : -comparison;
    })
    .map((entry) => entry.row);
}

/** Convertit une date en timestamp pour le tri, NaN si invalide (sera envoyé en bas). */
export function dateSortValue(dateLike: string | null | undefined): number {
  if (!dateLike) return NaN;
  const time = new Date(dateLike).getTime();
  return Number.isNaN(time) ? NaN : time;
}

export function SortIndicator<TSortKey extends string>({
  sortConfig,
  columnKey,
}: {
  sortConfig: SortConfig<TSortKey>;
  columnKey: TSortKey;
}) {
  if (sortConfig?.key !== columnKey) return null;

  return <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
}

export function SortableTh<TSortKey extends string>({
  label,
  sortKey,
  sortConfig,
  onSort,
  className,
  align = "left",
}: {
  label: string;
  sortKey: TSortKey;
  sortConfig: SortConfig<TSortKey>;
  onSort: (key: TSortKey) => void;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const justify =
    align === "right"
      ? "justify-end"
      : align === "center"
        ? "justify-center"
        : "justify-start";

  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex w-full items-center gap-1 ${justify} hover:text-amber-400 transition-colors cursor-pointer`}
      >
        {label}
        <SortIndicator sortConfig={sortConfig} columnKey={sortKey} />
      </button>
    </th>
  );
}
