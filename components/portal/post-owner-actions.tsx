"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { portalActions } from "@/lib/portal/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const TYPES = [
  { value: "feedback", label: "Feedback" },
  { value: "feature_request", label: "Feature request" },
  { value: "bug_report", label: "Bug report" },
];

/**
 * Edit/Delete controls shown on the public post page only to the logged-in user
 * who authored the post (server-side ownership is still enforced).
 */
export function PostOwnerActions({
  tenant,
  postId,
  authorId,
  title,
  description,
  postType,
}: {
  tenant: string;
  postId: number;
  authorId: number | null;
  title: string;
  description: string;
  postType: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  const [editOpen, setEditOpen] = useState(false);
  const [t, setT] = useState(title);
  const [d, setD] = useState(description);
  const [type, setType] = useState(postType);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = session?.user?.accessToken;
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const isOwner = Boolean(token) && authorId != null && userId === authorId;

  if (!isOwner) return null;

  const save = async () => {
    if (!t.trim() || !token) return;
    setBusy(true);
    setError(null);
    const res = await portalActions.editPost(
      tenant,
      postId,
      { title: t.trim(), description: d.trim(), postType: type },
      token
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.message || "Failed to save changes.");
      return;
    }
    setEditOpen(false);
    router.refresh();
  };

  const remove = async () => {
    if (!token) return;
    setBusy(true);
    const res = await portalActions.deletePost(tenant, postId, token);
    setBusy(false);
    if (res.ok) router.push(`/portal/${encodeURIComponent(tenant)}`);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil className="h-4 w-4" />
        Edit
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your post along with its votes and
              comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit your feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ep-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="ep-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-title">Title</Label>
              <Input
                id="ep-title"
                value={t}
                onChange={(e) => setT(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-desc">
                Details{" "}
                <span className="font-normal text-[#1c0a0c]/40">(optional)</span>
              </Label>
              <Textarea
                id="ep-desc"
                value={d}
                onChange={(e) => setD(e.target.value)}
                className="min-h-[110px]"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={busy || !t.trim()}
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
