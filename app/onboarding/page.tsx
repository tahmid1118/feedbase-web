"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usersApi, type WorkspaceAuth } from "@/lib/api";
import { useSubdomainAvailability } from "@/lib/hooks/use-subdomain-availability";
import { SubdomainStatusHint } from "@/components/dashboard/subdomain-status-hint";
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
  const searchParams = useSearchParams();
  const token = session?.user?.accessToken;

  // Set when the account arrived by accepting a workspace invitation: they
  // already belong to that workspace, still create their OWN one here, and then
  // land in the workspace they were invited to.
  const invitedTenantId = searchParams.get("invited");

  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [website, setWebsite] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Freeze the availability check while submitting: once the workspace is
  // created the subdomain legitimately exists (as this account's own), and the
  // token change from `update()` would otherwise re-run the check and flash a
  // false "already taken" before we navigate away.
  const subStatus = useSubdomainAvailability(creating ? "" : subdomain, token);
  const subdomainBlocked =
    subStatus === "checking" || subStatus === "taken" || subStatus === "invalid";

  // Not logged in → login. Already has a workspace → dashboard. An invited user
  // DOES have a workspace (the one they joined) but still needs to create their
  // own, so don't bounce them.
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && session?.user?.tenantId && !invitedTenantId)
      router.replace("/dashboard");
  }, [status, session?.user?.tenantId, invitedTenantId, router]);

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
      if (res.data) {
        let auth = res.data;
        // Invited users finish in the workspace that invited them.
        if (invitedTenantId) {
          try {
            const switched = await usersApi.switchWorkspace(
              Number(invitedTenantId),
              auth.token
            );
            if (switched.data) auth = switched.data;
          } catch {
            /* fall back to their own new workspace */
          }
        }
        await applyAuth(auth);
      } else setError("Something went wrong. Please try again.");
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
          {invitedTenantId && (
            <p className="mt-3 rounded-lg border border-[#e399a3]/30 bg-[#fdf8f9] px-3 py-2 text-sm text-[#1c0a0c]/70">
              🎉 You&apos;ve joined the workspace you were invited to. Create your
              own workspace here — we&apos;ll take you straight back to theirs
              afterwards.
            </p>
          )}
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
            <SubdomainStatusHint status={subStatus} />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            onClick={handleCreate}
            disabled={
              creating || !name.trim() || !subdomain.trim() || subdomainBlocked
            }
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
