"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./custom_table";
import { Input } from "./input";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchableKey?: keyof T;
  toolbarContent?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  searchableKey,
  toolbarContent,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredData = useMemo(() => {
    if (!searchableKey) return data;
    return data.filter((item) =>
      String(item[searchableKey])
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase())
    );
  }, [debouncedSearchTerm, data, searchableKey]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="mx-auto">
      {(searchableKey || toolbarContent) && (
        <div className="flex flex-col md:flex-row justify-between gap-3 items-start md:items-center mb-4">
          {searchableKey && (
            <Input
              placeholder={`Search by ${String(searchableKey)
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 px-5 py-3 rounded-full shadow-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-50 transition"
            />
          )}
          {toolbarContent && <div>{toolbarContent}</div>}
        </div>
      )}

      <div className="table-container max-h-[calc(100vh-250px)] overflow-y-auto rounded-md border border-[#e0e0e0] shadow-md custom-scrollbar">
        <Table className="relative max-h-[80%]">
          <TableHeader className="sticky top-0 whitespace-nowrap bg-[#ff4d5d]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-[#e0e0e0]"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-white font-bold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group bg-gradient-to-r from-red-50 to-white border-b border-[#e0e0e0]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="group-hover:bg-red-100 transition-colors duration-200"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="border-b border-[#e0e0e0]">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
