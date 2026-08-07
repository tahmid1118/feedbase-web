import type { Metadata } from "next";
import Link from "next/link";

import {
  Bullets,
  Clause,
  Fill,
  LegalShell,
  LegalTable,
} from "@/components/legal/legal-shell";
import { legal, legalHref } from "@/lib/legal";

// Plain "Privacy Policy" — the root layout's title template ("%s — FeedBoard")
// already appends the brand suffix; including it here too would double it.
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `What personal data ${legal.product} collects, why, who it is shared with, and how to exercise your rights.`,
};

export default function PrivacyPage() {
  return (
    <LegalShell
      slug="privacy"
      summary={`What we collect, why we collect it, and what you can ask us to do about it. We don't sell personal data and we don't run advertising or analytics trackers.`}
    >
      <Clause n={1} heading="Who is responsible for your data">
        <p>
          <Fill value={legal.entity} label="registered legal entity" />
          {legal.address ? `, ${legal.address},` : ""} a sole proprietorship
          established in{" "}
          <Fill value={legal.jurisdiction} label="governing jurisdiction" />, is
          the controller for personal data about{" "}
          <strong>account holders</strong> — the people who sign up, own or join a
          workspace, and pay us.
        </p>
        {!legal.address && (
          <p>
            We are a small independent business without public premises, so we do
            not publish a street address. Our postal address is available on
            request: email{" "}
            <a className="underline" href={`mailto:${legal.contactEmail}`}>
              {legal.contactEmail}
            </a>{" "}
            and we will provide it. Purchases are sold by our payment provider as
            merchant of record, and their trader details are shown at checkout and
            on your receipt.
          </p>
        )}
        <p>
          For content posted on a <strong>customer&rsquo;s public board</strong>{" "}
          (posts, comments, votes, submitter emails), the{" "}
          <strong>workspace owner is the controller</strong> and we act as their
          processor: we host it on their behalf and follow their instructions.
          If you submitted feedback to someone&rsquo;s board and want it removed,
          contact that workspace first; we will help them, or act ourselves where
          the law requires.
        </p>
      </Clause>

      <Clause n={2} heading="What we collect">
        <p className="font-medium text-[#1c0a0c]">From account holders</p>
        <Bullets
          items={[
            "Name, email address and password (stored only as a bcrypt hash — we cannot read it). An account created with “Continue with Google” has no password at all until you set one.",
            "If you sign in with Google: your Google account's identifier, email address, name and profile picture, received from Google at each sign-in. We never receive your Google password, and we ask Google for nothing beyond these basics.",
            "Optional profile details: contact number and profile picture.",
            "Workspace details you create: name, subdomain, logo and brand colour.",
            "Billing status: plan, billing interval, subscription state and current period end. Card details go straight to Paddle and never reach our servers.",
            "Support chat messages you send us, and our replies.",
          ]}
        />
        <p className="mt-4 font-medium text-[#1c0a0c]">From board visitors</p>
        <Bullets
          items={[
            "Post and comment text, and any attachments you upload.",
            "A contact email if you submit without an account, so the team can reply about your submission. It is stored but never displayed publicly.",
            "An optional display name. If you leave it blank we show a generated pseudonym instead.",
            "A random browser identifier (fb_guest_id) so your submissions share one pseudonymous identity.",
            "A one-way hash of your IP address, stored with posts, comments and votes to stop automated spam and vote manipulation. We store only the hash — never the IP address itself — and it cannot be reversed back into an address.",
            "An automated spam score for your submission, with the reasons behind it, so the workspace team can review anything held back.",
          ]}
        />
        <p className="mt-4 font-medium text-[#1c0a0c]">Automatically</p>
        <Bullets
          items={[
            "Device sessions: a session identifier with your IP address, browser user-agent, and first/last-seen times — used to keep you signed in and to enforce the one-device limit on Free and Pro.",
            "Audit records of significant workspace actions, including the acting user, IP address and user-agent.",
            "Password-reset requests: the requesting IP and a hashed, single-use token valid for one hour.",
            "Server access logs containing IP address, request path, response status, timestamp and user-agent, kept for security and debugging.",
          ]}
        />
        <p>
          We do <strong>not</strong> collect special-category data, we do not run
          advertising or analytics trackers, and we do not build profiles or make
          automated decisions with legal effects about you.
        </p>
      </Clause>

      <Clause n={3} heading="Why we use it, and our legal basis">
        <LegalTable
          head={["Purpose", "Data", "Basis"]}
          rows={[
            ["Create and run your account and workspaces", "Account, workspace and content data", "Performance of a contract"],
            ["Deliver a public board and show submissions on it", "Content, display name, pseudonymous id", "Contract (customer) / legitimate interests (visitor)"],
            ["Take payment and manage subscriptions", "Email, plan and billing status", "Performance of a contract"],
            ["Transactional email — invitations, password resets, and telling a submitter their feedback shipped", "Email address, related content", "Contract / legitimate interests"],
            ["Keep accounts secure, prevent abuse and vote manipulation, enforce plan limits", "Session data, IP, user-agent, pseudonymous id, audit records", "Legitimate interests"],
            ["Detect and hold back spam on public boards without making visitors solve a CAPTCHA or create an account", "Hashed IP address, submission content, spam score and reasons", "Legitimate interests"],
            ["Remember your language choice", "Language cookie", "Legitimate interests"],
            ["Answer support requests", "Support chat content", "Contract / legitimate interests"],
            ["Comply with law and respond to lawful requests", "As required", "Legal obligation"],
          ]}
        />
        <p>
          We send only transactional email. We do not send marketing email unless
          you ask us to.
        </p>
      </Clause>

      <Clause n={4} heading="Who we share it with">
        <p>
          We do not sell personal data. We share it only with providers who help
          us run the service, each bound to protect it and to use it solely on our
          instructions:
        </p>
        <LegalTable
          head={["Provider", "What it handles"]}
          rows={[
            ["Paddle", "Our Merchant of Record: processes payments, subscriptions, sales tax/VAT and invoices as the seller of record. Receives your email and billing details directly; we never receive card numbers."],
            ["Hosting provider", "The servers and database that run the application and store content and uploads."],
            ["Cloudflare", "DNS, TLS and reverse proxy for our domains; bot and abuse protection."],
            ["Email provider", "Delivery of transactional email such as invitations and password resets."],
            ["Google", "Only if you choose “Continue with Google”: Google authenticates you and tells us your Google account identifier, email, name and picture. Google acts as its own controller for what happens on their side, under their privacy policy. Using this is entirely optional — you can create an account with an email address and password instead."],
          ]}
        />
        <p>
          We may also disclose data where legally required, to enforce our terms,
          or as part of a merger or acquisition — in which case we will tell you
          before your data becomes subject to a different policy.
        </p>
        <p>
          Separately, remember that a workspace owner and their team can see
          everything submitted to their board, including a guest submitter&rsquo;s
          contact email on paid plans.
        </p>
      </Clause>

      <Clause n={5} heading="International transfers">
        <p>
          Our providers may process data outside your country. Where data leaves
          the UK/EEA we rely on an adequacy decision or on Standard Contractual
          Clauses with appropriate safeguards. Ask us at{" "}
          <a href={`mailto:${legal.privacyEmail}`} className="font-medium text-[#c74959] hover:underline">
            {legal.privacyEmail}
          </a>{" "}
          for details of the transfers relevant to you.
        </p>
      </Clause>

      <Clause n={6} heading="How long we keep it">
        <Bullets
          items={[
            "Account and workspace data: for as long as your account exists, and then as described below.",
            "Board content: until you or the workspace owner deletes it, or the workspace is deleted.",
            "Device sessions: revoked when you sign out or when another device takes over; abandoned sessions become eligible for takeover after 15 minutes of inactivity.",
            "Password-reset tokens: one hour, single use.",
            "Support conversations: retained after a chat is closed so we have a record of what was asked and advised. You lose access to a closed chat but we keep the transcript.",
            "Promotional code redemptions: a record that a code was redeemed by your email address is kept even after account deletion, so that single-use offers cannot be claimed repeatedly.",
            "Server access and audit logs: kept for a limited period for security and debugging, then discarded.",
          ]}
        />
        <p>
          <strong>When you delete your account:</strong> the workspaces you own are
          deleted along with their posts, comments, roadmap and changelog, your
          device sessions are revoked, any live subscription is cancelled, and
          your billing record, password-reset tokens, pending invitations and any
          social sign-in link are erased. Workspaces you only joined are not deleted — content you posted
          there remains but is no longer attributed to you. Deletion requires your
          password and is irreversible. Backups may retain copies for a short
          period before being overwritten. We may also delete an account on your
          request through support, or where our Terms allow; the effect is the
          same as deleting it yourself.
        </p>
      </Clause>

      <Clause n={7} heading="Your rights">
        <p>
          Depending on where you live you may have the right to access a copy of
          your data, correct it, delete it, restrict or object to our use of it,
          receive it in a portable form, and withdraw consent where we relied on
          it.
        </p>
        <Bullets
          items={[
            "Access and correct most data yourself in Settings → Profile.",
            "Delete everything you own from Settings → Profile → Danger zone.",
            <>
              For anything else, email{" "}
              <a href={`mailto:${legal.privacyEmail}`} className="font-medium text-[#c74959] hover:underline">
                {legal.privacyEmail}
              </a>
              . We aim to reply within 30 days and will not charge you for a
              reasonable request.
            </>,
          ]}
        />
        <p>
          If you are unhappy with how we handled a request you can complain to your
          local data-protection authority. We would rather you told us first so we
          can put it right.
        </p>
      </Clause>

      <Clause n={8} heading="How we protect it">
        <Bullets
          items={[
            "Traffic is encrypted with TLS. Passwords are stored as bcrypt hashes, never in plain text.",
            "Access to the application uses short-lived bearer tokens tied to a server-side device session that can be revoked.",
            "Uploads are validated by type and size, re-encoded before storage, and scoped to the workspace that owns them.",
            "Workspace data is separated per tenant, and every authenticated read and write is scoped to the caller's workspace.",
            "Internal administrative access is limited to the operator of the platform and is used to run and support the service.",
          ]}
        />
        <p>
          No service can promise perfect security. If a breach affects your
          personal data and creates a real risk to you, we will notify you and any
          regulator we are required to inform.
        </p>
      </Clause>

      <Clause n={9} heading="Children">
        <p>
          The service is not intended for children. Do not create an account if you
          are under 16 (or the age of digital consent where you live, if higher). If
          you believe a child has given us personal data, contact us and we will
          delete it.
        </p>
      </Clause>

      <Clause n={10} heading="Cookies">
        <p>
          We use a small number of cookies, all of them necessary or functional —
          no advertising or analytics trackers. See the{" "}
          <Link href={legalHref("cookies")} className="font-medium text-[#c74959] hover:underline">
            Cookie Policy
          </Link>{" "}
          for the exact list, purposes and lifetimes.
        </p>
      </Clause>

      <Clause n={11} heading="Changes to this policy">
        <p>
          We will update this page when our practices change and revise the
          &ldquo;last updated&rdquo; date. For material changes affecting account
          holders we will give notice by email or in the app.
        </p>
      </Clause>
    </LegalShell>
  );
}
