"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import { tenantsApi, uploaderApi, type Tenant } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function BrandingSettings() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const res = await uploaderApi.uploadImage(file, token);
      setLogoUrl(res.filePath);
      toast.success("Logo uploaded. Save changes to apply it.");
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
        },
        token
      );
      toast.success("Workspace updated");
    } catch (e) {
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
      <h3 className="text-lg font-semibold text-[#1c0a0c]">Workspace &amp; Branding</h3>
      <p className="text-sm text-[#1c0a0c]/60">
        Customize how your feedback portal appears to users
      </p>

      <div className="mt-6 space-y-2">
        <Label>Company logo</Label>
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
          <Label htmlFor="ws-name">Workspace name</Label>
          <Input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ws-subdomain">Subdomain</Label>
          <Input id="ws-subdomain" value={tenant.subdomain} disabled />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
          onClick={save}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </Card>
  );
}
