"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import { tenantsApi, uploaderApi, type Tenant } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/avatar";
import { useSubdomainAvailability } from "@/lib/hooks/use-subdomain-availability";
import { SubdomainStatusHint } from "@/components/dashboard/subdomain-status-hint";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

export function BrandingSettings() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [originalSubdomain, setOriginalSubdomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only validate/gate on availability when the subdomain actually changed —
  // otherwise the account's OWN current subdomain would read as "taken".
  const subdomainChanged = subdomain !== originalSubdomain && subdomain !== "";
  const subStatus = useSubdomainAvailability(
    subdomainChanged ? subdomain : "",
    token
  );
  const subdomainBlocked =
    subdomainChanged &&
    (subStatus === "checking" || subStatus === "taken" || subStatus === "invalid");

  useEffect(() => {
    if (!token) return;
    tenantsApi
      .getMine(token)
      .then((res) => {
        if (res.data) applyTenant(res.data);
      })
      .catch(() => toast.error("Failed to load workspace"))
      .finally(() => setLoading(false));
  }, [token]);

  const applyTenant = (t: Tenant) => {
    setTenant(t);
    setName(t.name ?? "");
    setLogoUrl(t.branding_logo_url ?? "");
    setSubdomain(t.subdomain ?? "");
    setOriginalSubdomain(t.subdomain ?? "");
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const res = await uploaderApi.uploadImage(file, token);
      setLogoUrl(res.filePath);
      toast.success(t("toast.logoUploaded"));
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async () => {
    if (!token || !tenant) return;
    setSaving(true);
    try {
      await tenantsApi.update(
        tenant.id,
        {
          name: name.trim(),
          brandingLogoUrl: logoUrl.trim(),
          subdomain: subdomain.trim(),
        },
        token
      );
      setOriginalSubdomain(subdomain.trim());
      setTenant({ ...tenant, subdomain: subdomain.trim() });
      toast.success(t("toast.workspaceUpdated"));
    } catch (e) {
      // Surfaces e.g. "That subdomain is already taken".
      toast.error((e as Error)?.message || "Failed to update workspace");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center text-[#1c0a0c]/60">
          Loading workspace...
        </div>
      </Card>
    );
  }

  if (!tenant) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center text-[#1c0a0c]/60">
          No workspace available to manage.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-[#1c0a0c]">{t("branding.title")}</h3>
      <p className="text-sm text-[#1c0a0c]/60">
        Customize how your feedback portal appears to users
      </p>

      <div className="mt-6 space-y-2">
        <Label>{t("branding.companyLogo")}</Label>
        <p className="text-xs text-[#1c0a0c]/50">
          Shown in the header of your public board. A square PNG or SVG works best.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e399a3]/30 bg-[#fdf8f9]">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveUploadUrl(logoUrl)}
                alt="Logo preview"
                className="h-full w-full object-contain"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-[#1c0a0c]/30" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload logo
            </Button>
            {logoUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[#1c0a0c]/60"
                onClick={() => setLogoUrl("")}
                disabled={uploading}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ws-name">{t("onboarding.workspaceName")}</Label>
          <Input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ws-subdomain">{t("onboarding.subdomain")}</Label>
          <Input
            id="ws-subdomain"
            value={subdomain}
            onChange={(e) =>
              setSubdomain(
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
              )
            }
            placeholder="your-workspace"
          />
          {subdomainChanged ? (
            <SubdomainStatusHint status={subStatus} />
          ) : (
            <p className="text-xs text-[#1c0a0c]/50">
              Your portal: {subdomain || "…"}.{ROOT_DOMAIN.split(":")[0]}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
          onClick={save}
          disabled={saving || subdomainBlocked}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            t("common.saveChanges")
          )}
        </Button>
      </div>
    </Card>
  );
}
