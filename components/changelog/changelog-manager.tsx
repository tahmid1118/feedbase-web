"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";
import {
  changelogApi,
  extractRows,
  type Changelog,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ChangelogEditorDialog } from "@/components/changelog/changelog-editor-dialog";
import { toast } from "sonner";

export function ChangelogManager() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Changelog | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await changelogApi.list(
        { itemsPerPage: 100, currentPageNumber: 0, sortOrder: "desc", filterBy: "" },
        token
      );
      setChangelogs(extractRows<Changelog>(res.data, "changelogs"));
    } catch (error) {
      console.error("Failed to load changelogs:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (changelog: Changelog) => {
    setEditing(changelog);
    setEditorOpen(true);
  };

  const publish = async (id: number) => {
    if (!token) return;
    try {
      await changelogApi.publish(id, token);
      toast.success(t("toast.changelogPublished"));
      await load();
    } catch {
      toast.error(t("changelog.publishFailed"));
    }
  };

  const remove = async (id: number) => {
    if (!token) return;
    try {
      await changelogApi.delete(id, token);
      toast.success(t("toast.changelogDeleted"));
      await load();
    } catch {
      toast.error(t("changelog.deleteFailed"));
    }
  };

  return (
    <>
      <div className="flex items-center justify-end">
        <Button
          className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          {t("changelog.newChangelog")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[#1c0a0c]/60">
          {t("changelog.loading")}
        </div>
      ) : changelogs.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#1c0a0c]/30" />
          <p className="mt-4 text-[#1c0a0c]/60">{t("changelog.noChangelogs")}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {changelogs.map((changelog) => (
            <Card key={changelog.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/changelog/${changelog.id}`}
                      className="text-xl font-semibold text-[#1c0a0c] hover:text-[#c74959]"
                    >
                      {changelog.title}
                    </Link>
                    {changelog.is_published === 1 ? (
                      <Badge className="bg-green-100 text-green-700">
                        {t("changelog.published")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[#1c0a0c]/60">
                        {t("changelog.draft")}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[#1c0a0c]/70">
                    {changelog.summary}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-[#1c0a0c]/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {changelog.created_at
                        ? new Date(changelog.created_at).toLocaleDateString()
                        : "Recently"}
                    </span>
                    {changelog.created_by_name && (
                      <span>by {changelog.created_by_name}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {changelog.is_published !== 1 && (
                    <Button
                      size="sm"
                      onClick={() => publish(changelog.id)}
                      className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {t("changelog.publish")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(changelog)}
                    aria-label={t("changelog.editAria")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        aria-label={t("changelog.deleteAria")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("changelog.deleteConfirm")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          &quot;{changelog.title}&quot; will be permanently
                          removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => remove(changelog.id)}
                        >
                          {t("common.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ChangelogEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        changelog={editing}
        onSaved={load}
      />
    </>
  );
}
