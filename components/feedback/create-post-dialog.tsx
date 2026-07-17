"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { postsApi, billingApi, uploaderApi } from "@/lib/api";
import type { UploadedAttachment } from "@/lib/api/uploader";
import { AttachmentPicker } from "@/components/feedback/attachment-picker";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  postType: z.enum(["feedback", "feature_request", "bug_report"]),
});

type PostFormValues = z.infer<typeof postSchema>;

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  onCreated,
}: CreatePostDialogProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  // null = not yet known; gates the picker on the workspace plan (Pro+).
  const [attachmentsAllowed, setAttachmentsAllowed] = useState<boolean | null>(
    null
  );

  const token = session?.user?.accessToken;

  // Learn the plan when the dialog opens, so the picker only appears on Pro+.
  useEffect(() => {
    if (!open || !token || attachmentsAllowed !== null) return;
    let cancelled = false;
    billingApi
      .getStatus(token)
      .then((res) => {
        if (!cancelled) setAttachmentsAllowed(Boolean(res.data?.limits?.attachments));
      })
      .catch(() => {
        if (!cancelled) setAttachmentsAllowed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, token, attachmentsAllowed]);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      description: "",
      postType: "feature_request",
    },
  });

  const onSubmit = async (values: PostFormValues) => {
    if (!session?.user?.accessToken) {
      toast.error("You must be logged in to create a post");
      return;
    }

    setIsSubmitting(true);
    try {
      await postsApi.create(
        { ...values, attachmentIds: attachments.map((a) => a.id) },
        session.user.accessToken
      );
      toast.success("Post created successfully!");
      form.reset();
      setAttachments([]);
      onOpenChange(false);
      onCreated?.();
      router.refresh();
    } catch (error) {
      toast.error("Failed to create post");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("feedback.createNewPost")}</DialogTitle>
          <DialogDescription>
            Share your feedback, feature request, or bug report
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("portal.title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("feedback.titlePlaceholder2")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("feedback.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("feedback.descPlaceholder2")}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormField
                control={form.control}
                name="postType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("feedback.selectType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="feedback">💬 Feedback</SelectItem>
                        <SelectItem value="feature_request">✨ Feature Request</SelectItem>
                        <SelectItem value="bug_report">🐛 Bug Report</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {attachmentsAllowed && (
              <div className="space-y-2">
                <FormLabel>{t("feedback.attachments")}</FormLabel>
                <AttachmentPicker
                  value={attachments}
                  onChange={setAttachments}
                  upload={(file) => uploaderApi.uploadAttachment(file, token!)}
                />
              </div>
            )}
            {attachmentsAllowed === false && (
              <p className="text-xs text-[#1c0a0c]/50">
                Want to attach screenshots or a screen recording?{" "}
                <Link
                  href="/dashboard/settings?tab=billing"
                  className="font-medium text-[#c74959] hover:underline"
                >
                  Upgrade to Pro
                </Link>
                .
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Post"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
