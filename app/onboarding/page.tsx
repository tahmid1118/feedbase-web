"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usersApi, type WorkspaceAuth } from "@/lib/api";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

function slugifySubdomain(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const token = session?.user?.accessToken;

  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [website, setWebsite] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not logged in → login. Already has a workspace → dashboard.
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && session?.user?.tenantId)
      router.replace("/dashboard");
  }, [status, session?.user?.tenantId, router]);

  const applyAuth = async (auth: WorkspaceAuth) => {
    await update({
      accessToken: auth.token,
      tenantId: String(auth.user.tenantId),
      role: auth.user.role,
      userId: String(auth.user.id),
    });
    // Hard reload so the dashboard renders with the freshly written session
    // cookie (a soft router push can race the update and bounce back here).
    window.location.assign("/dashboard");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!subdomainTouched) setSubdomain(slugifySubdomain(value));
  };

  const handleCreate = async () => {
    if (!token || !name.trim() || !subdomain.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await usersApi.createWorkspace(
        {
          name: name.trim(),
          subdomain: subdomain.trim(),
          website: website.trim() || undefined,
        },
        token
      );
      if (res.data) await applyAuth(res.data);
      else setError("Something went wrong. Please try again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create workspace.");
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fdf8f9] px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-2">
          <Logo className="h-9 w-9" />
          <span className="text-2xl font-bold text-[#1c0a0c]">Feedbase</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-[#1c0a0c]">
            Create your workspace
          </h1>
          <p className="mt-2 text-[#1c0a0c]/60">
            Set up a space to collect feedback, plan your roadmap, and share
            updates.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ob-website">
              Website{" "}
              <span className="font-normal text-[#1c0a0c]/40">(optional)</span>
            </Label>
            <Input
              id="ob-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="yoursite.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ob-name">Workspace name</Label>
            <Input
              id="ob-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Product"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ob-subdomain">Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input
                id="ob-subdomain"
                value={subdomain}
                onChange={(e) => {
                  setSubdomainTouched(true);
                  setSubdomain(slugifySubdomain(e.target.value));
                }}
                placeholder="my-product"
                className="flex-1"
              />
              <span className="shrink-0 text-sm text-[#1c0a0c]/50">
                .{ROOT_DOMAIN.split(":")[0]}
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim() || !subdomain.trim()}
            className="h-11 w-full bg-[#c74959] text-white hover:bg-[#b03f4d]"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Workspace"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
