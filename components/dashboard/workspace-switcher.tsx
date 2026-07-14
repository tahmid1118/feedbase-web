"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { usersApi, type Workspace, type WorkspaceAuth } from "@/lib/api";
import { useSubdomainAvailability } from "@/lib/hooks/use-subdomain-availability";
import { SubdomainStatusHint } from "@/components/dashboard/subdomain-status-hint";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

function slugifySubdomain(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function Tile({ name, color }: { name: string; color?: string | null }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
      style={{ backgroundColor: color || "#c74959" }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function WorkspaceSwitcher() {
  const { data: session, update } = useSession();
  const token = session?.user?.accessToken;

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [switching, setSwitching] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [website, setWebsite] = useState("");
  const [creating, setCreating] = useState(false);
  const subStatus = useSubdomainAvailability(subdomain, token);
  const subdomainBlocked =
    subStatus === "checking" || subStatus === "taken" || subStatus === "invalid";

  const load = useCallback(() => {
    if (!token) return;
    usersApi
      .getWorkspaces(token)
      .then((res) => setWorkspaces(res.data?.workspaces ?? []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const current = workspaces.find((w) => w.current) ?? workspaces[0];
  const currentName = current?.name ?? session?.user?.name ?? "Workspace";

  // Two kinds of workspace: the ones this account owns, and the ones it was
  // invited into as a member.
  const owned = workspaces.filter((w) => w.role === "owner");
  const joined = workspaces.filter((w) => w.role !== "owner");

  const renderWorkspace = (w: Workspace) => (
    <DropdownMenuItem
      key={w.tenant_id}
      onClick={() => handleSwitch(w)}
      className="gap-2"
    >
      <Tile name={w.name} color={w.branding_primary_color} />
      <span className="min-w-0 flex-1 truncate">{w.name}</span>
      {w.current && <Check className="h-4 w-4 shrink-0 text-[#c74959]" />}
    </DropdownMenuItem>
  );

  // Apply a fresh auth payload (from switch/create) and hard-reload so the whole
  // app re-scopes to the new workspace. A soft router.refresh() races the
  // session-cookie write, so the change wouldn't take on the first click.
  const applyAuth = async (auth: WorkspaceAuth) => {
    await update({
      accessToken: auth.token,
      tenantId: String(auth.user.tenantId),
      role: auth.user.role,
      userId: String(auth.user.id),
    });
    window.location.assign("/dashboard");
  };

  const handleSwitch = async (w: Workspace) => {
    if (!token || w.current || switching) return;
    setSwitching(true);
    try {
      const res = await usersApi.switchWorkspace(w.tenant_id, token);
      if (res.data) {
        await applyAuth(res.data); // reloads the page
      } else {
        setSwitching(false);
        toast.error("Failed to switch workspace");
      }
    } catch {
      setSwitching(false);
      toast.error("Failed to switch workspace");
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!subdomainTouched) setSubdomain(slugifySubdomain(value));
  };

  const handleCreate = async () => {
    if (!token || !name.trim() || !subdomain.trim()) return;
    setCreating(true);
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
        await applyAuth(res.data); // auto-switch into the new workspace (reloads)
      } else {
        setCreating(false);
        toast.error("Failed to create workspace");
      }
    } catch (error) {
      setCreating(false);
      toast.error(
        error instanceof Error ? error.message : "Failed to create workspace"
      );
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg border border-[#e399a3]/20 bg-white px-2 py-1.5 text-left transition-colors hover:border-[#c74959]/40"
          >
            <Tile name={currentName} color={current?.branding_primary_color} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#1c0a0c]">
                {currentName}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-[#1c0a0c]/50">
                {current && current.role !== "owner" && (
                  <span className="shrink-0 rounded bg-[#c74959]/10 px-1 py-px font-medium text-[#c74959]">
                    Member
                  </span>
                )}
                <span className="truncate">
                  {current
                    ? `${current.subdomain}.${ROOT_DOMAIN.split(":")[0]}`
                    : "Workspace"}
                </span>
              </p>
            </div>
            {switching ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#1c0a0c]/40" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-[#1c0a0c]/40" />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          {owned.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-[#1c0a0c]/50">
                Your workspaces
              </DropdownMenuLabel>
              {owned.map(renderWorkspace)}
            </>
          )}

          {joined.length > 0 && (
            <>
              {owned.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-[#1c0a0c]/50">
                Shared with you
              </DropdownMenuLabel>
              {joined.map(renderWorkspace)}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="gap-2 font-medium text-[#c74959]"
          >
            <Plus className="h-4 w-4" />
            Add Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create workspace dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Create your workspace</DialogTitle>
            <DialogDescription>
              Set up a space to collect feedback, plan your roadmap, and share
              updates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-website">
                Website{" "}
                <span className="font-normal text-[#1c0a0c]/40">(optional)</span>
              </Label>
              <Input
                id="ws-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="yoursite.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Product"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-subdomain">Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="ws-subdomain"
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                creating || !name.trim() || !subdomain.trim() || subdomainBlocked
              }
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
