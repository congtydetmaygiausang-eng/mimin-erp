"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, 
  Settings2, SlidersHorizontal, ArrowUpDown, X, Loader2, MoreHorizontal 
} from "lucide-react";
import { EmptyState } from "./EmptyState";

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  minWidth?: string;
  hidden?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  // Search & Filter
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filterSlot?: React.ReactNode;
  toolbarExtra?: React.ReactNode;
  // Options
  pageSize?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  stickyHeader?: boolean;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  actions,
  searchable = true,
  searchPlaceholder = "Tìm kiếm nhanh...",
  searchKeys,
  filterSlot,
  toolbarExtra,
  pageSize = 15,
  loading = false,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Không tìm thấy dữ liệu nào phù hợp.",
  emptyAction,
  stickyHeader = true,
  className = "",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    columns.forEach((c) => {
      init[c.id] = !c.hidden;
    });
    return init;
  });
  const [showColPicker, setShowColPicker] = useState(false);

  // 1. Search filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const q = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((k) => String(item[k] || "").toLowerCase().includes(q));
      }
      return Object.values(item).some((val) => 
        val != null && typeof val !== "object" && String(val).toLowerCase().includes(q)
      );
    });
  }, [data, searchTerm, searchKeys]);

  // 2. Sort
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = col.accessorKey ? a[col.accessorKey] : a[col.id];
      const valB = col.accessorKey ? b[col.accessorKey] : b[col.id];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // 3. Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (colId: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortColumn === colId) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(colId);
      setSortDirection("asc");
    }
  };

  const activeColumns = columns.filter((c) => visibleColumns[c.id] !== false);

  const paddingClasses = density === "compact" ? "py-2 px-3 text-xs" : "py-3 px-4 text-sm";

  return (
    <div className={`space-y-3 ${className}`}>
      {/* TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          {searchable && (
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter slot & Controls */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {filterSlot}

          {/* Density toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-0.5">
            <button
              onClick={() => setDensity("compact")}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition ${
                density === "compact"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Chế độ xem gọn"
            >
              Gọn
            </button>
            <button
              onClick={() => setDensity("comfortable")}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition ${
                density === "comfortable"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Chế độ xem vừa"
            >
              Vừa
            </button>
          </div>

          {/* Column Visibility Selector */}
          <div className="relative">
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition"
              title="Bật/Tắt hiển thị cột"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cột</span>
            </button>

            {showColPicker && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-30 animate-fade-in text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300 px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                  Hiển thị cột
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {columns.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[c.id] !== false}
                        onChange={(e) => {
                          setVisibleColumns((prev) => ({ ...prev, [c.id]: e.target.checked }));
                        }}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="truncate">{c.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {toolbarExtra}
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead
              className={`bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold ${
                stickyHeader ? "sticky top-0 z-10" : ""
              }`}
            >
              <tr>
                {activeColumns.map((col) => {
                  const isSorted = sortColumn === col.id;
                  const alignClass =
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";

                  return (
                    <th
                      key={col.id}
                      onClick={() => handleSort(col.id, col.sortable)}
                      style={{ width: col.width, minWidth: col.minWidth }}
                      className={`px-3 py-2.5 ${alignClass} ${
                        col.sortable ? "cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800" : ""
                      }`}
                    >
                      <div className={`inline-flex items-center gap-1 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""}`}>
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-slate-400">
                            {isSorted ? (
                              sortDirection === "asc" ? (
                                <ChevronUp className="w-3.5 h-3.5 text-teal-600" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
                              )
                            ) : (
                              <ChevronsUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {actions && <th className="px-3 py-2.5 text-center w-16">Thao tác</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={activeColumns.length + (actions ? 1 : 0)} className="py-16 text-center">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + (actions ? 1 : 0)} className="py-12">
                    <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr
                    key={keyExtractor(row)}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors group ${
                      onRowClick ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50" : ""
                    }`}
                  >
                    {activeColumns.map((col) => {
                      const alignClass =
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";
                      const content = col.cell
                        ? col.cell(row, idx)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? "")
                        : "";

                      return (
                        <td key={col.id} className={`${paddingClasses} ${alignClass} align-middle`}>
                          {content}
                        </td>
                      );
                    })}
                    {actions && (
                      <td
                        className={`${paddingClasses} text-center align-middle`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {!loading && sortedData.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div>
              Hiển thị{" "}
              <b className="text-slate-800 dark:text-slate-200">
                {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)}
              </b>{" "}
              -{" "}
              <b className="text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * pageSize, sortedData.length)}
              </b>{" "}
              trong tổng số <b className="text-slate-800 dark:text-slate-200">{sortedData.length}</b> bản ghi
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                aria-label="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;
