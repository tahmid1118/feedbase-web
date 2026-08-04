import type { Metadata } from "next";
import Link from "next/link";

import {
  Bullets,
  Clause,
  Fill,
  LegalShell,
} from "@/components/legal/legal-shell";
import { legal, legalHref } from "@/lib/legal";

// Plain "Terms of Service" — the root layout's title template
// ("%s — FeedBoard") already appends the brand suffix; including it here too
// would double it.
export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The agreement between you and ${legal.product} for use of the feedback board service.`,
};

export default function TermsPage() {
  return (
    <LegalShell
      slug="terms"
      summary={`These terms govern your use of ${legal.product}. In short: you own your content, you're responsible for what happens on your boards, we bill in advance and you can cancel any time.`}
    >
      <Clause n={1} heading="Who we are and what you're agreeing to">
        <p>
          {legal.product} is operated by{" "}
          <Fill value={legal.entity} label="registered legal entity" />
          {legal.address ? `, ${legal.address},` : ""} a sole proprietorship
          established in{" "}
          <Fill value={legal.jurisdiction} label="governing jurisdiction" />{" "}
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account, using a
          workspace, or posting on a public board, you agree to these terms. If
          you are agreeing on behalf of a company, you confirm you may bind it.
        </p>
        {!legal.address && (
          <p>
            We do not publish a street address. Our postal address is available on
            request — email{" "}
            <a className="underline" href={`mailto:${legal.contactEmail}`}>
              {legal.contactEmail}
            </a>
            . Subscriptions are sold by our payment provider acting as{" "}
            <strong>merchant of record</strong>: your purchase contract for the
            payment itself is with them, and their trader details and address
            appear at checkout and on every receipt.
          </p>
        )}
        <p>
          If you do not agree, do not use the service. These terms sit alongside
          our{" "}
          <Link href={legalHref("privacy")} className="font-medium text-[#c74959] hover:underline">
            Privacy Policy
          </Link>
          ,{" "}
          <Link href={legalHref("cookies")} className="font-medium text-[#c74959] hover:underline">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link href={legalHref("refunds")} className="font-medium text-[#c74959] hover:underline">
            Refund Policy
          </Link>
          , which form part of this agreement.
        </p>
      </Clause>

      <Clause n={2} heading="Definitions">
        <Bullets
          items={[
            <><strong>Service</strong> — the {legal.product} application, its API, and the public feedback boards it hosts.</>,
            <><strong>Workspace</strong> — a single feedback board and its settings, roadmap, changelog and members. Each workspace has exactly one Owner.</>,
            <><strong>Owner</strong> — the account that created the workspace. Owners control settings, billing and membership.</>,
            <><strong>Member</strong> — someone invited into a workspace by its Owner.</>,
            <><strong>Visitor</strong> — anyone using a workspace&rsquo;s public board, with or without an account.</>,
            <><strong>Customer Content</strong> — everything submitted to a workspace: posts, comments, votes, attachments, roadmap items, changelog entries, branding and settings.</>,
          ]}
        />
      </Clause>

      <Clause n={3} heading="Accounts and security">
        <Bullets
          items={[
            "You must provide a real email address and keep your details accurate. You are responsible for activity under your account.",
            "You must be at least 16 years old, or the minimum age of digital consent where you live if that is higher.",
            "Keep your password confidential. Tell us promptly if you believe your account has been accessed without permission.",
            <>
              On the <strong>Free and Pro</strong> plans an account may be signed
              in on <strong>one device at a time</strong> — a new sign-in offers
              to end the other session. <strong>Business</strong> allows
              simultaneous devices. This is a product limit, not a security
              guarantee.
            </>,
            "Sessions expire after a period of inactivity and you will need to sign in again.",
          ]}
        />
      </Clause>

      <Clause n={4} heading="Workspaces, roles and public boards">
        <Bullets
          items={[
            "A workspace has one Owner and cannot be transferred. How many workspaces you may own or join depends on your plan.",
            "Owners may invite Members up to their plan's seat limit and may remove them at any time.",
            <>
              Each workspace gets a <strong>public board</strong> at its own
              subdomain. Anything posted there — titles, descriptions, comments,
              attachments, vote counts and a display name — is{" "}
              <strong>publicly visible to anyone with the link</strong>, is
              indexable by search engines, and may appear in link previews.
              Do not post confidential information.
            </>,
            "Owners decide what stays on their board and may edit statuses, pin, reject or (on paid plans) delete posts.",
            "You are responsible for what you and your Members do, and for meeting any notice or consent obligations you owe to your own users.",
          ]}
        />
      </Clause>

      <Clause n={5} heading="Visitor submissions and display identity">
        <Bullets
          items={[
            "A Visitor without an account must give a contact email so the workspace team can reply about their submission. That email is never shown on the public board.",
            "A Visitor who leaves no name is shown under a generated pseudonym and colour, consistent across their own posts and comments. This is presentational only.",
            "A signed-in Visitor is attributed to their account and may edit or delete their own posts and comments.",
            "Votes are limited per browser using a persistent identifier. Attempting to inflate votes is a breach of these terms.",
          ]}
        />
      </Clause>

      <Clause n={6} heading="Acceptable use">
        <p>You must not, and must not permit anyone else to:</p>
        <Bullets
          items={[
            "post unlawful, infringing, defamatory, harassing, hateful or sexually exploitative content, or anything harmful to minors;",
            "upload malware, or attachments other than the permitted image and short-video formats;",
            "impersonate any person, or misrepresent yourself as the workspace owner or as our staff;",
            "probe, scan, overload or otherwise interfere with the service, or bypass rate limits, seat limits, plan limits or device-session limits;",
            "scrape or bulk-extract content or personal data, or resell access to the service;",
            "use the service to send unsolicited messages, or to collect data you have no lawful basis to collect.",
          ]}
        />
        <p>
          We may remove content or suspend access where we reasonably believe
          these rules have been broken, or where required by law.
        </p>
      </Clause>

      <Clause n={7} heading="Attachments and limits">
        <Bullets
          items={[
            "Attachments are available on paid plans. A post may carry up to three files: images up to 10 MB each, video up to 50 MB each.",
            "We may compress, resize or re-encode uploads for storage and display.",
            "Plan limits (seats, workspaces, attachments, replying as the owner, deleting feedback, contacting submitters, multiple devices) are enforced by the service and may change with notice.",
          ]}
        />
      </Clause>

      <Clause n={8} heading="Your content and the licence you give us">
        <Bullets
          items={[
            "You (or your Visitors) keep all rights in Customer Content. We claim no ownership.",
            "You grant us a worldwide, non-exclusive, royalty-free licence to host, store, copy, transmit, resize, display and back up Customer Content strictly as needed to operate the service for you, and to comply with law.",
            "You confirm you have the rights needed to submit the content and to grant this licence.",
            "Feedback you give us about the product itself may be used freely to improve the service, without obligation to you.",
          ]}
        />
      </Clause>

      <Clause n={9} heading="Plans, billing and taxes">
        <Bullets
          items={[
            "Paid plans are billed in advance, monthly or yearly, through Paddle, our Merchant of Record (the seller of record for your purchase, which also handles applicable sales tax/VAT). We never see or store your card details.",
            "A subscription attaches to your account and covers every workspace you own — not per workspace. Seats are per workspace.",
            "Upgrades take effect immediately and are charged pro rata. Downgrades take effect at the end of the current paid period — you keep your current plan until then, with no charge for the change and no refund for the remainder of that period.",
            "Prices shown exclude taxes unless stated. Any tax collected is handled at checkout.",
            "Promotional prices and promo codes apply as described at the time of purchase and may be withdrawn for new purchases at any time.",
            "If a payment fails and remains unpaid, the workspace reverts to the Free plan and paid capabilities stop.",
            <>
              Cancellation and refunds are covered by the{" "}
              <Link href={legalHref("refunds")} className="font-medium text-[#c74959] hover:underline">
                Refund Policy
              </Link>
              .
            </>,
          ]}
        />
      </Clause>

      <Clause n={10} heading="Availability, support and changes">
        <Bullets
          items={[
            "We aim to keep the service available and reliable but do not promise uninterrupted operation. There is no service-level agreement on any plan unless we have agreed one in writing.",
            "Maintenance, updates and occasional downtime are expected. We will try to give notice of planned interruptions.",
            "Support is provided by email and through the in-app support chat, in English, during normal working hours.",
            "We may add, change or withdraw features. If a change materially reduces what a paid plan does, you may cancel and we will refund the unused portion of a prepaid term.",
          ]}
        />
      </Clause>

      <Clause n={11} heading="Suspension and termination">
        <Bullets
          items={[
            "You may stop using the service at any time, cancel a subscription from the Billing tab, or delete your account from Settings.",
            "We may suspend or terminate access for breach of these terms, non-payment, or if we must do so by law — normally with notice, and immediately where there is risk of harm or legal exposure.",
            <>
              <strong>Deleting your account deletes the workspaces you own</strong>,
              including their posts, comments, roadmap and changelog, and removes
              your Members&rsquo; access. Workspaces you merely joined survive;
              content you posted there remains but is no longer attributed to you.
              This is irreversible.
            </>,
            "Clauses that by nature should survive termination (content licence for backups already made, liability, governing law) do so.",
          ]}
        />
      </Clause>

      <Clause n={12} heading="Disclaimers">
        <p>
          The service is provided &ldquo;as is&rdquo;. To the extent permitted by
          law we exclude implied warranties of merchantability, fitness for a
          particular purpose and non-infringement. We do not warrant that the
          service will be error-free, that content will always be available, or
          that it will meet any particular requirement. We are not responsible for
          Customer Content, including content your Visitors post.
        </p>
      </Clause>

      <Clause n={13} heading="Limitation of liability">
        <p>
          To the extent permitted by law, neither party is liable for indirect,
          incidental, special or consequential loss, loss of profits, revenue,
          goodwill or data. Our total liability arising out of or relating to the
          service is limited to the greater of (a) the amount you paid us in the
          twelve months before the claim, and (b) USD 100.
        </p>
        <p>
          Nothing here limits liability that cannot lawfully be limited —
          including death or personal injury caused by negligence, fraud, or your
          statutory rights as a consumer.
        </p>
      </Clause>

      <Clause n={14} heading="Indemnity">
        <p>
          You will defend and indemnify us against claims, losses and reasonable
          costs arising from Customer Content, your use of the service in breach
          of these terms, or your infringement of a third party&rsquo;s rights.
        </p>
      </Clause>

      <Clause n={15} heading="Changes to these terms">
        <p>
          We may update these terms. For material changes we will give reasonable
          notice by email or in the app before they take effect. Continuing to use
          the service after that date means you accept the new terms; if you do
          not, cancel before they take effect.
        </p>
      </Clause>

      <Clause n={16} heading="Governing law and disputes">
        <p>
          These terms are governed by the laws of{" "}
          <Fill value={legal.jurisdiction} label="governing jurisdiction" /> and
          disputes will be heard by the courts of{" "}
          <Fill
            value={legal.courts || legal.jurisdiction}
            label="competent courts"
          />
          . If you are a consumer, this does not deprive you of the protection of
          the mandatory law of your country of residence, or of your right to
          bring proceedings there.
        </p>
        <p>
          Please email{" "}
          <a href={`mailto:${legal.contactEmail}`} className="font-medium text-[#c74959] hover:underline">
            {legal.contactEmail}
          </a>{" "}
          first — nearly everything is resolved faster that way.
        </p>
      </Clause>
    </LegalShell>
  );
}
