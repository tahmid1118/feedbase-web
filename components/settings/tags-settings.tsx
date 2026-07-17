"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { tagsApi, extractRows, type Tag } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

const DEFAULT_COLOR = "#c74959";

export function TagsSettings() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tagsApi.list(token);
      setTags(extractRows<Tag>(res.data, "tags"));
    } catch {
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setColor(DEFAULT_COLOR);
    setDialogOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setEditing(tag);
    setName(tag.name);
    setColor(tag.color_hex || DEFAULT_COLOR);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!token || !name.trim()) return;
    setBusy(true);
    try {
      if (editing) {
        await tagsApi.update(editing.id, { name: name.trim(), colorHex: color }, token);
        toast.success("Tag updated");
      } else {
        await tagsApi.create({ name: name.trim(), colorHex: color }, token);
        toast.success("Tag created");
      }
      setDialogOpen(false);
      await load();
    } catch {
      toast.error("Failed to save tag");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!token) return;
    try {
      await tagsApi.delete(id, token);
      setTags((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tag deleted");
    } catch {
      toast.error("Failed to delete tag");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1c0a0c]">Tags</h3>
          <p className="text-sm text-[#1c0a0c]/60">
            Organize and categorize feedback posts
          </p>
        </div>
        <Button
          className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          New Tag
        </Button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="py-8 text-center text-[#1c0a0c]/60">
            Loading tags...
          </div>
        ) : tags.length === 0 ? (
          <div className="py-8 text-center text-[#1c0a0c]/60">
            No tags yet. Create one to start categorizing feedback.
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between rounded-lg border border-[#e399a3]/20 p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: tag.color_hex || DEFAULT_COLOR }}
                  />
                  <Badge
                    variant="outline"
                    style={{
                      color: tag.color_hex || DEFAULT_COLOR,
                      borderColor: tag.color_hex || DEFAULT_COLOR,
                    }}
                  >
                    {tag.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(tag)}
                    aria-label={t("tags.editTag")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        aria-label={t("tags.deleteTag")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("tags.deleteTagConfirm")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          &quot;{tag.name}&quot; will be removed from all posts.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => remove(tag.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editing ? t("tags.editTagTitle") : "New Tag"}</DialogTitle>
            <DialogDescription>
              Tags help categorize and filter feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ui"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-color">{t("tags.color")}</Label>
              <div className="flex items-center gap-3">
                <input
                  id="tag-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded border border-[#e399a3]/30"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
              onClick={save}
              disabled={busy || !name.trim()}
            >
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
