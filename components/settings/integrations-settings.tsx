"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Plug } from "lucide-react";
import {
  integrationsApi,
  parseJsonField,
  type Integration,
  type IntegrationType,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

const TYPES: { value: IntegrationType; label: string }[] = [
  { value: "slack", label: "Slack" },
  { value: "discord", label: "Discord" },
  { value: "webhook", label: "Webhook" },
  { value: "zapier", label: "Zapier" },
];

export function IntegrationsSettings() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<IntegrationType>("slack");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channel, setChannel] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await integrationsApi.list(token);
      setIntegrations(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setType("slack");
    setWebhookUrl("");
    setChannel("");
    setDialogOpen(true);
  };

  const create = async () => {
    if (!token || !webhookUrl.trim()) {
      toast.error("Webhook URL is required");
      return;
    }
    setBusy(true);
    try {
      await integrationsApi.create(
        {
          integrationType: type,
          config: {
            webhookUrl: webhookUrl.trim(),
            ...(type === "slack" && channel.trim()
              ? { channel: channel.trim() }
              : {}),
          },
        },
        token
      );
      toast.success(t("toast.integrationCreated"));
      setDialogOpen(false);
      await load();
    } catch {
      toast.error("Failed to create integration");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (integration: Integration) => {
    if (!token) return;
    try {
      await integrationsApi.toggle(integration.id, token);
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integration.id
            ? { ...i, is_active: i.is_active === 1 ? 0 : 1 }
            : i
        )
      );
    } catch {
      toast.error("Failed to toggle integration");
    }
  };

  const remove = async (id: number) => {
    if (!token) return;
    try {
      await integrationsApi.delete(id, token);
      setIntegrations((prev) => prev.filter((i) => i.id !== id));
      toast.success(t("toast.integrationDeleted"));
    } catch {
      toast.error("Failed to delete integration");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1c0a0c]">Integrations</h3>
          <p className="text-sm text-[#1c0a0c]/60">
            Forward feedback events to Slack, Discord, and webhooks
          </p>
        </div>
        <Button
          className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          Add Integration
        </Button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="py-8 text-center text-[#1c0a0c]/60">
            Loading integrations...
          </div>
        ) : integrations.length === 0 ? (
          <div className="py-8 text-center text-[#1c0a0c]/60">
            No integrations configured yet.
          </div>
        ) : (
          <div className="space-y-2">
            {integrations.map((integration) => {
              const config = parseJsonField<Record<string, string>>(
                integration.config,
                {}
              );
              return (
                <div
                  key={integration.id}
                  className="flex items-center justify-between rounded-lg border border-[#e399a3]/20 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-[#c74959]/10 p-2">
                      <Plug className="h-4 w-4 text-[#c74959]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize text-[#1c0a0c]">
                          {integration.integration_type}
                        </span>
                        <Badge
                          className={
                            integration.is_active === 1
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {integration.is_active === 1 ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 max-w-md truncate text-xs text-[#1c0a0c]/60">
                        {config.webhookUrl || config.url || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={integration.is_active === 1}
                      onCheckedChange={() => toggle(integration)}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          aria-label="Delete integration"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete integration?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This {integration.integration_type} integration will
                            stop receiving events.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => remove(integration.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>
              Connect a destination for feedback notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as IntegrationType)}
              >
                <SelectTrigger>
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
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>

            {type === "slack" && (
              <div className="space-y-2">
                <Label htmlFor="channel">Channel (optional)</Label>
                <Input
                  id="channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="#product-feedback"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
              onClick={create}
              disabled={busy || !webhookUrl.trim()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
