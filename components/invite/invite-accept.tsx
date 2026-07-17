"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Loader2, LogIn, UserPlus } from "lucide-react";

import {
  invitationsApi,
  acceptInvitationAsNewUser,
  type WorkspaceAuth,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_LANGUAGE } from "@/lib/auth/constants";
import { endSession } from "@/lib/auth/end-session";

export function InviteAccept({
  token,
  email,
  workspaceName,
  hasAccount,
}: {
  token: string;
  email: string;
  workspaceName: string;
  hasAccount: boolean;
}) {
  const { t } = useTranslation();
  const { data: session, update } = useSession();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedInEmail = session?.user?.email?.toLowerCase();
  const invitedEmail = email.toLowerCase();

  const header = (
    <div className="mb-6 text-center">
      <h1 className="text-xl font-bold leading-snug text-[#1c0a0c]">
        You&apos;ve been invited to{" "}
        <span className="text-[#c74959]">{workspaceName}</span>
      </h1>
      <p className="mt-2 text-sm text-[#1c0a0c]/65">
        Invitation for <span className="font-medium text-[#1c0a0c]">{email}</span>
      </p>
    </div>
  );

  /** Existing account, signed in as the invited email → join immediately. */
  const joinAsExisting = async () => {
    const accessToken = session?.user?.accessToken;
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await invitationsApi.acceptAsExistingUser(token, accessToken);
      const auth = res.data as WorkspaceAuth | undefined;
      if (!auth) {
        setError("Could not accept the invitation.");
        setBusy(false);
        return;
      }
      // Re-scope the session to the workspace they just joined.
      await update({
        accessToken: auth.token,
        tenantId: String(auth.user.tenantId),
        role: auth.user.role,
        userId: String(auth.user.id),
      });
      window.location.assign("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept the invitation.");
      setBusy(false);
    }
  };

  /** New account: set name + password, join, sign in, then create own workspace. */
  const signUpAndJoin = async () => {
    if (!fullName.trim() || password.length < 8) return;
    setBusy(true);
    setError(null);

    const res = await acceptInvitationAsNewUser(token, {
      fullName: fullName.trim(),
      password,
    });
    if (!res.ok || !res.data) {
      setError(res.message || "Could not accept the invitation.");
      setBusy(false);
      return;
    }
    const invitedTenantId = res.data.user.tenantId;

    // Log them in with the credentials they just set.
    const login = await signIn("credentials", {
      email,
      password,
      lg: DEFAULT_LANGUAGE,
      redirect: false,
    });
    if (!login || login.error) {
      // Account + membership exist; just send them to log in manually.
      router.replace("/login");
      return;
    }

    // As with any new signup, create their OWN workspace next — then land in the
    // workspace they were invited to.
    window.location.assign(`/onboarding?invited=${invitedTenantId}`);
  };

  // --- Existing account paths ---
  if (hasAccount) {
    if (!session?.user?.userId) {
      return (
        <>
          {header}
          <p className="mb-5 rounded-lg bg-[#fdf8f9] px-3 py-2.5 text-sm text-[#1c0a0c]/70">
            You already have a Feedbase account. Sign in as{" "}
            <span className="font-medium text-[#1c0a0c]">{email}</span> to join this
            workspace.
          </p>
          <Button
            className="h-11 w-full bg-[#c74959] text-white hover:bg-[#b03f4d]"
            onClick={() =>
              router.push(`/login?next=${encodeURIComponent(`/invite/${token}`)}`)
            }
          >
            <LogIn className="h-4 w-4" />
            Sign in to accept
          </Button>
        </>
      );
    }

    if (signedInEmail !== invitedEmail) {
      return (
        <>
          {header}
          <p className="mb-5 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            You&apos;re signed in as{" "}
            <span className="font-medium">{session.user.email}</span>, but this
            invitation is for <span className="font-medium">{email}</span>.
          </p>
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() =>
              endSession(session.user.accessToken, {
                callbackUrl: `/invite/${token}`,
              })
            }
          >
            Sign out and switch account
          </Button>
        </>
      );
    }

    return (
      <>
        {header}
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <Button
          className="h-11 w-full bg-[#c74959] text-white hover:bg-[#b03f4d]"
          onClick={joinAsExisting}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            `Join ${workspaceName}`
          )}
        </Button>
      </>
    );
  }

  // --- New account: signup ---
  return (
    <>
      {header}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          signUpAndJoin();
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="inv-email">{t("auth.email")}</Label>
          <Input id="inv-email" value={email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv-name">{t("auth.fullName")}</Label>
          <Input
            id="inv-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv-pw">{t("invite.createPassword")}</Label>
          <Input
            id="inv-pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("invite.atLeast8")}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="h-11 w-full bg-[#c74959] text-white hover:bg-[#b03f4d]"
          disabled={busy || !fullName.trim() || password.length < 8}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create account &amp; join
            </>
          )}
        </Button>
        <p className="text-center text-xs text-[#1c0a0c]/50">
          Next you&apos;ll set up your own workspace, then land in {workspaceName}.
        </p>
      </form>
    </>
  );
}
