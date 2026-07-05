"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  usersApi,
  extractRows,
  type User,
  type UserRole,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ROLES: UserRole[] = ["owner", "user"];

export function TeamSettings() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await usersApi.list(token);
      setUsers(extractRows<User>(res.data, "users"));
    } catch {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (userId: number, role: UserRole) => {
    if (!token) return;
    try {
      await usersApi.updateRole(userId, role, token);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role } : u))
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-[#1c0a0c]">Team Members</h3>
      <p className="text-sm text-[#1c0a0c]/60">
        Manage roles and permissions for users in your workspace
      </p>

      <div className="mt-6">
        {loading ? (
          <div className="py-8 text-center text-[#1c0a0c]/60">
            Loading members...
          </div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-[#1c0a0c]/60">
            No team members found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[160px]">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#c74959] text-xs text-white">
                          {initials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-[#1c0a0c]">
                        {user.full_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#1c0a0c]/70">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role ?? "user"}
                      onValueChange={(v) =>
                        changeRole(user.user_id, v as UserRole)
                      }
                    >
                      <SelectTrigger className="h-8 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem
                            key={role}
                            value={role}
                            className="capitalize"
                          >
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
}
