import clsx from "classnames";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import styles from "./DataTable.module.css";

type SortDirection = "asc" | "desc";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  pagination?: PaginationProps;
  onSortChange?: (column: string, direction: SortDirection) => void;
}

export function DataTable<T>({ data, columns, emptyMessage = "No records", pagination, onSortChange }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ column: string; direction: SortDirection } | null>(null);

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const column = sort.column as keyof T;
    return [...data].sort((a, b) => {
      const first = a[column];
      const second = b[column];
      if (first === second) return 0;
      if (first == null) return 1;
      if (second == null) return -1;
      if (typeof first === "number" && typeof second === "number") {
        return sort.direction === "asc" ? first - second : second - first;
      }
      const firstStr = String(first).toLowerCase();
      const secondStr = String(second).toLowerCase();
      if (firstStr < secondStr) return sort.direction === "asc" ? -1 : 1;
      if (firstStr > secondStr) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sort]);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    const key = String(column.key);
    setSort((prev) => {
      const nextDirection: SortDirection = prev && prev.column === key && prev.direction === "asc" ? "desc" : "asc";
      onSortChange?.(key, nextDirection);
      return { column: key, direction: nextDirection };
    });
  };

  const rows = sortedData.length ? (
    sortedData.map((row, idx) => (
      <tr key={idx}>
        {columns.map((column) => (
          <td key={String(column.key)} style={{ textAlign: column.align ?? "left" }}>
            {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key as string] ?? "")}
          </td>
        ))}
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={columns.length} className={styles.empty}>
        {emptyMessage}
      </td>
    </tr>
  );

  return (
    <div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => {
                const key = String(column.key);
                const isSorted = sort?.column === key;
                const indicator = isSorted ? (sort?.direction === "asc" ? "▲" : "▼") : "";
                return (
                  <th
                    key={key}
                    style={{ textAlign: column.align ?? "left" }}
                    onClick={() => handleSort(column)}
                  >
                    {column.header}
                    {column.sortable && <span className={styles.sortIndicator}>{indicator}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
      {pagination && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={clsx("scrollbar-thin", styles.paginationButton)}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
          </span>
          <button
            type="button"
            className={clsx("scrollbar-thin", styles.paginationButton)}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
