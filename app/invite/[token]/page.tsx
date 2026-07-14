import Link from "next/link";
import { MailX } from "lucide-react";

import { publicApi } from "@/lib/api/public";
import { Logo } from "@/components/ui/logo";
import { InviteAccept } from "@/components/invite/invite-accept";

export const metadata = {
  title: "Workspace invitation · Feedbase",
};

const REASON_COPY: Record<string, { title: string; body: string }> = {
  not_found: {
    title: "Invitation not found",
    body: "This link doesn't match any invitation. Double-check the link from your email.",
  },
  expired: {
    title: "This invitation has expired",
    body: "Invitations are valid for 7 days. Ask the workspace owner to send you a new one.",
  },
  revoked: {
    title: "This invitation was revoked",
    body: "The workspace owner cancelled this invitation. Ask them to send a new one.",
  },
  already_accepted: {
    title: "This invitation was already used",
    body: "Invitation links work only once. If this was you, just log in to reach the workspace.",
  },
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await publicApi.getInvitation(token);

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center bg-[#fdf8f9] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="text-xl font-bold text-[#1c0a0c]">Feedbase</span>
        </div>
        <div className="rounded-2xl border border-[#e399a3]/35 bg-white p-8 shadow-[0_30px_70px_-45px_rgba(28,10,12,0.5)]">
          {children}
        </div>
      </div>
    </div>
  );

  if (!invitation || !invitation.valid) {
    const copy =
      REASON_COPY[invitation?.reason ?? "not_found"] ?? REASON_COPY.not_found;
    return shell(
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <MailX className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-bold text-[#1c0a0c]">{copy.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#1c0a0c]/65">{copy.body}</p>
        <Link
          href="/login"
          className="mt-5 inline-block text-sm font-semibold text-[#c74959] hover:underline"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return shell(
    <InviteAccept
      token={token}
      email={invitation.email ?? ""}
      workspaceName={invitation.workspaceName ?? "a workspace"}
      hasAccount={Boolean(invitation.hasAccount)}
    />
  );
}
