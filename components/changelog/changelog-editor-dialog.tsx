"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { changelogApi, type Changelog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Markdown } from "@/components/ui/markdown";
import { toast } from "sonner";

interface ChangelogEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changelog?: Changelog | null;
  onSaved?: () => void;
}

export function ChangelogEditorDialog({
  open,
  onOpenChange,
  changelog,
  onSaved,
}: ChangelogEditorDialogProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(changelog?.title ?? "");
      setSummary(changelog?.summary ?? "");
      setContent(changelog?.content ?? "");
    }
  }, [open, changelog]);

  const save = async () => {
    if (!token || !title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
      };
      if (changelog) {
        await changelogApi.update(changelog.id, payload, token);
        toast.success(t("toast.changelogUpdated"));
      } else {
        await changelogApi.create(payload, token);
        toast.success(t("toast.changelogCreated"));
      }
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast.error("Failed to save changelog");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>
            {changelog ? "Edit Changelog" : "New Changelog"}
          </DialogTitle>
          <DialogDescription>
            Markdown is supported in the content field.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cl-title">Title</Label>
            <Input
              id="cl-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. June 2026 Update"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cl-summary">Summary</Label>
            <Input
              id="cl-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A short one-line summary"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <Tabs defaultValue="write">
              <TabsList className="border border-[#e399a3]/30 bg-white">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write" className="mt-2">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"## New Features\n- Added dark mode\n- Fixed login bug"}
                  className="min-h-[220px] font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="min-h-[220px] rounded-lg border border-[#e399a3]/20 bg-white p-4">
                  {content.trim() ? (
                    <Markdown content={content} />
                  ) : (
                    <p className="text-sm text-[#1c0a0c]/50">
                      Nothing to preview yet.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
            onClick={save}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : changelog ? (
              "Save Changes"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
