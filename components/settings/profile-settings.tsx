"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Upload } from "lucide-react";
import { usersApi, uploaderApi, type PersonalData } from "@/lib/api";
import { resolveAvatarUrl } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteAccount } from "@/components/settings/delete-account";
import { toast } from "sonner";

export function ProfileSettings() {
  const { t } = useTranslation();
  const { data: session, update } = useSession();
  const token = session?.user?.accessToken;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<PersonalData | null>(null);
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!token) return;
    usersApi
      .getPersonalData(token)
      .then((res) => {
        if (res.data) {
          setProfile(res.data);
          setFullName(res.data.full_name ?? "");
          setContact(res.data.contact_no ?? "");
          setAvatarPath(res.data.avatar_url ?? null);
        }
      })
      .catch(() => toast.error("Failed to load profile"));
  }, [token]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const res = await uploaderApi.uploadImage(file, token);
      setAvatarPath(res.filePath);
      toast.success("Image uploaded. Save your profile to apply it.");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveProfile = async () => {
    if (!token || !profile) return;
    setSavingProfile(true);
    try {
      await usersApi.updateProfile(
        {
          userId: profile.user_id,
          fullName: fullName.trim(),
          contact: contact.trim(),
          ...(avatarPath ? { avatarUrl: avatarPath } : {}),
        },
        token
      );
      // Refresh the session so the header avatar/name update immediately.
      await update({
        name: fullName.trim(),
        image: resolveAvatarUrl(avatarPath) ?? null,
      });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!token) return;
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await usersApi.changePassword(oldPassword, newPassword, token);
      toast.success("Password updated");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to update password. Check your current password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#1c0a0c]">{t("user.profile")}</h3>
        <p className="text-sm text-[#1c0a0c]/60">
          Update your personal information
        </p>

        <div className="mt-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={resolveAvatarUrl(avatarPath)} alt={fullName} />
            <AvatarFallback className="bg-[#c74959] text-lg text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
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
              Change photo
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full-name">{t("auth.fullName")}</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" value={profile?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">{t("settings.contactNumber")}</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={profile?.role ?? "user"}
              disabled
              className="capitalize"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
            onClick={saveProfile}
            disabled={savingProfile || !profile}
          >
            {savingProfile ? (
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

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#1c0a0c]">{t("settings.password")}</h3>
        <p className="text-sm text-[#1c0a0c]/60">
          Change your account password
        </p>

        <div className="mt-6 grid gap-4 sm:max-w-md">
          <div className="space-y-2">
            <Label htmlFor="old-password">{t("settings.currentPassword")}</Label>
            <Input
              id="old-password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("settings.newPassword")}</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("settings.confirmNewPassword")}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            className="bg-[#c74959] text-white hover:bg-[#b03f4d]"
            onClick={savePassword}
            disabled={savingPassword || !oldPassword || !newPassword}
          >
            {savingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              t("settings.updatePassword")
            )}
          </Button>
        </div>
      </Card>

      <DeleteAccount />
    </div>
  );
}
