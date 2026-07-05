"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Pin, ThumbsUp, MessageSquare, Trash2, Search } from "lucide-react";
import { adminApi, type AdminPost } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LocalTime } from "@/components/local-time";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUSES = ["open", "planned", "in_progress", "completed", "closed"];
const FILTERS = ["all", ...STATUSES];

const label = (s: string) => s.replace("_", " ");

export default function AdminWorkspacePostsPage() {
  const params = useParams();
  const id = Number(params.id);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    adminApi.getWorkspace(token, id).then((res) => {
      const t = res.data?.tenant as { name?: string } | undefined;
      if (t?.name) setWorkspaceName(t.name);
    });
  }, [token, id]);

  const load = useCallback(
    async (st?: string, q?: string) => {
      if (!token || !id) return;
      try {
        setLoading(true);
        const res = await adminApi.listWorkspacePosts(token, id, {
          status: (st ?? status) === "all" ? undefined : st ?? status,
          search: q ?? search,
        });
        setPosts(res.data?.rows ?? []);
      } finally {
        setLoading(false);
      }
    },
    [token, id, status, search]
  );

  useEffect(() => {
    load(status, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id, status]);

  const counts = useMemo(() => posts.length, [posts]);

  const changeStatus = async (p: AdminPost, next: string) => {
    if (!token || next === p.status) return;
    const res = await adminApi.setPostStatus(token, id, p.id, next);
    if (res.ok) {
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
      toast.success(`Status set to ${label(next)}`);
    } else toast.error(res.message || "Failed");
  };

  const togglePin = async (p: AdminPost) => {
    if (!token) return;
    const next = p.is_pinned ? false : true;
    const res = await adminApi.setPostPin(token, id, p.id, next);
    if (res.ok) {
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_pinned: next ? 1 : 0 } : x)));
      toast.success(next ? "Pinned" : "Unpinned");
    } else toast.error(res.message || "Failed");
  };

  const remove = async (p: AdminPost) => {
    if (!token) return;
    const res = await adminApi.deleteWorkspacePost(token, id, p.id);
    if (res.ok) {
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Post deleted");
    } else toast.error(res.message || "Failed");
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/workspaces"
          className="inline-flex items-center gap-1 text-sm text-[#1c0a0c]/60 hover:text-[#1c0a0c]"
        >
          <ArrowLeft className="h-4 w-4" />
          All workspaces
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-[#1c0a0c]">
          {workspaceName || "Workspace"} · Posts
        </h2>
        <p className="text-sm text-[#1c0a0c]/60">
          Moderate this workspace&apos;s feedback — change status, pin, or delete.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatus(f)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors",
                status === f
                  ? "bg-[#c74959] text-white"
                  : "text-[#1c0a0c]/60 hover:bg-[#fdf8f9] hover:text-[#c74959]"
              )}
            >
              {f === "all" ? "All" : label(f)}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(status, search);
          }}
          className="flex gap-2"
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-48"
          />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">Loading…</div>
        ) : counts === 0 ? (
          <div className="py-12 text-center text-[#1c0a0c]/60">No posts.</div>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-[#e399a3]/20 text-left text-xs uppercase tracking-wide text-[#1c0a0c]/50">
              <tr>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-[#e399a3]/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.is_pinned ? (
                        <Pin className="h-3.5 w-3.5 shrink-0 fill-[#c74959] text-[#c74959]" />
                      ) : null}
                      <span className="font-medium text-[#1c0a0c]">{p.title}</span>
                    </div>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {label(p.post_type)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#1c0a0c]/70">{p.author_name}</td>
                  <td className="px-4 py-3">
                    <Select value={p.status} onValueChange={(v) => changeStatus(p, v)}>
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {label(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs text-[#1c0a0c]/60">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {p.vote_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {p.comment_count}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#1c0a0c]/60">
                    <LocalTime date={p.created_at} relative />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={p.is_pinned ? "Unpin" : "Pin"}
                        onClick={() => togglePin(p)}
                        className={p.is_pinned ? "text-[#c74959]" : ""}
                      >
                        <Pin className={cn("h-4 w-4", p.is_pinned && "fill-[#c74959]")} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes &quot;{p.title}&quot; along with
                              its votes and comments. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={() => remove(p)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
