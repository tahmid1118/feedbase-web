"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const API_BASE =
  process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL || "http://localhost:4560";

const TYPES = [
  { value: "feedback", label: "💬 Feedback" },
  { value: "feature_request", label: "✨ Feature request" },
  { value: "bug_report", label: "🐛 Bug report" },
];

export function FeedbackSubmit({
  tenant,
  brand,
}: {
  tenant: string;
  brand: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [postType, setPostType] = useState("feedback");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setPostType("feedback");
    setName("");
    setEmail("");
    setError(null);
    setDone(false);
  };

  const canSubmit = title.trim() && description.trim();

  const submit = async () => {
    if (!canSubmit) {
      setError("Please add a title and description.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/public/${encodeURIComponent(tenant)}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lg: "en",
            title: title.trim(),
            description: description.trim(),
            postType,
            submitterName: name.trim() || undefined,
            submitterEmail: email.trim() || undefined,
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      router.refresh(); // surface the new post on the board
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setTimeout(reset, 200);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="shrink-0 text-white hover:opacity-90"
        style={{ backgroundColor: brand }}
      >
        <MessageSquare className="h-4 w-4" />
        Give Feedback
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12" style={{ color: brand }} />
              <h3 className="text-lg font-semibold text-[#1c0a0c]">
                Thanks for your feedback!
              </h3>
              <p className="max-w-xs text-sm text-[#1c0a0c]/60">
                {email.trim()
                  ? "It's on the board now — we'll keep you posted by email as it progresses."
                  : "It's on the board now for the team to review."}
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" onClick={reset}>
                  Submit another
                </Button>
                <Button
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: brand }}
                  onClick={() => handleOpenChange(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Share your feedback</DialogTitle>
                <DialogDescription>
                  Tell us what you&apos;d like to see. Sharing your name and email
                  is optional.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-type">Type</Label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger id="fb-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-title">Title</Label>
                  <Input
                    id="fb-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="A short summary of your idea or issue"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-desc">Details</Label>
                  <Textarea
                    id="fb-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe it in a bit more detail…"
                    className="min-h-[110px]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fb-name">
                      Name{" "}
                      <span className="font-normal text-[#1c0a0c]/40">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="fb-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Anonymous"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb-email">
                      Email{" "}
                      <span className="font-normal text-[#1c0a0c]/40">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="fb-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submit}
                  disabled={submitting || !canSubmit}
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: brand }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit feedback"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
