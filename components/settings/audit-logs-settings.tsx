"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  auditLogsApi,
  extractRows,
  extractTotal,
  parseJsonField,
  type AuditLog,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

export function AuditLogsSettings() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await auditLogsApi.list(
        {
          itemsPerPage: PAGE_SIZE,
          currentPageNumber: page,
          sortOrder: "desc",
          filterBy: "",
        },
        {
          ...(actionFilter ? { action: actionFilter } : {}),
          ...(entityFilter ? { entityType: entityFilter } : {}),
        },
        token
      );
      setLogs(extractRows<AuditLog>(res.data, "logs"));
      setTotal(extractTotal(res.data));
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, actionFilter, entityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-[#1c0a0c]">Audit Logs</h3>
      <p className="text-sm text-[#1c0a0c]/60">
        Track actions performed across your workspace
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Input
          value={actionFilter}
          onChange={(e) => {
            setPage(0);
            setActionFilter(e.target.value);
          }}
          placeholder="Filter by action (e.g. POST_CREATED)"
          className="w-64"
        />
        <Input
          value={entityFilter}
          onChange={(e) => {
            setPage(0);
            setEntityFilter(e.target.value);
          }}
          placeholder="Filter by entity (e.g. post)"
          className="w-48"
        />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-[#1c0a0c]/60">
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-[#1c0a0c]/60">
            No audit logs found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const metadata = parseJsonField<Record<string, unknown>>(
                  log.metadata,
                  {}
                );
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#1c0a0c]/70">
                      {log.entity_type}
                      {log.entity_id ? ` #${log.entity_id}` : ""}
                    </TableCell>
                    <TableCell className="text-[#1c0a0c]/70">
                      {log.actor_name ?? "System"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-[#1c0a0c]/50">
                      {Object.keys(metadata).length > 0
                        ? JSON.stringify(metadata)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-[#1c0a0c]/50">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-[#1c0a0c]/60">
          {total} total · page {page + 1} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
