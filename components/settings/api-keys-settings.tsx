"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Copy, KeyRound, Ban, Check } from "lucide-react";
import {
  apiKeysApi,
  parseJsonField,
  API_KEY_SCOPES,
  type ApiKey,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

export function ApiKeysSettings() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read:posts"]);
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await apiKeysApi.list(token);
      setKeys(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const openCreate = () => {
    setName("");
    setScopes(["read:posts"]);
    setExpiresAt("");
    setCreatedKey(null);
    setDialogOpen(true);
  };

  const create = async () => {
    if (!token || !name.trim() || scopes.length === 0) {
      toast.error("Name and at least one scope are required");
      return;
    }
    setBusy(true);
    try {
      const res = await apiKeysApi.create(
        {
          keyName: name.trim(),
          scopes,
          ...(expiresAt ? { expiresAt: `${expiresAt} 00:00:00` } : {}),
        },
        token
      );
      setCreatedKey(res.data?.key ?? null);
      toast.success(t("toast.apiKeyCreated"));
      await load();
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: number) => {
    if (!token) return;
    try {
      await apiKeysApi.revoke(id, token);
      toast.success(t("toast.apiKeyRevoked"));
      await load();
    } catch {
      toast.error("Failed to revoke key");
    }
  };

  const copyKey = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(t("toast.copiedToClipboard"));
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1c0a0c]">API Keys</h3>
          <p className="text-sm text-[#1c0a0c]/60">
            Programmatic access to your workspace data
          </p>
        </div>
        <Button
          className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          New Key
        </Button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="py-8 text-center text-[#1c0a0c]/60">
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="py-8 text-center text-[#1c0a0c]/60">
            No API keys yet.
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => {
              const keyScopes = parseJsonField<string[]>(key.scopes, []);
              return (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border border-[#e399a3]/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-[#c74959]/10 p-2">
                      <KeyRound className="h-4 w-4 text-[#c74959]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1c0a0c]">
                          {key.key_name}
                        </span>
                        {key.is_revoked === 1 ? (
                          <Badge variant="destructive">Revoked</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-xs text-[#1c0a0c]/60">
                        {key.key_prefix}••••••••
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {keyScopes.map((scope) => (
                          <Badge
                            key={scope}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {scope}
                          </Badge>
                        ))}
                      </div>
                      {key.expires_at && (
                        <p className="mt-1 text-xs text-[#1c0a0c]/50">
                          Expires{" "}
                          {new Date(key.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {key.is_revoked !== 1 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Revoke
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Applications using &quot;{key.key_name}&quot; will
                            immediately lose access.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => revoke(key.id)}
                          >
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {createdKey ? "API Key Created" : "New API Key"}
            </DialogTitle>
            <DialogDescription>
              {createdKey
                ? "Copy this key now — you won't be able to see it again."
                : "Choose a name and the scopes this key can access."}
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#e399a3]/30 bg-[#fdf8f9] p-3">
                <code className="flex-1 break-all font-mono text-sm text-[#1c0a0c]">
                  {createdKey}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyKey(createdKey)}
                  aria-label="Copy key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key name</Label>
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Production API Key"
                />
              </div>

              <div className="space-y-2">
                <Label>Scopes</Label>
                <div className="grid grid-cols-2 gap-2">
                  {API_KEY_SCOPES.map((scope) => (
                    <label
                      key={scope}
                      className="flex items-center gap-2 rounded-md border border-[#e399a3]/20 p-2 text-sm"
                    >
                      <Checkbox
                        checked={scopes.includes(scope)}
                        onCheckedChange={() => toggleScope(scope)}
                      />
                      <span className="font-mono text-xs">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key-expiry">Expiry (optional)</Label>
                <Input
                  id="key-expiry"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {createdKey ? (
              <Button
                className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                onClick={() => setDialogOpen(false)}
              >
                <Check className="h-4 w-4" />
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
                  onClick={create}
                  disabled={busy || !name.trim() || scopes.length === 0}
                >
                  Create Key
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
