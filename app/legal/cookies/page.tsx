import type { Metadata } from "next";
import Link from "next/link";

import {
  Bullets,
  Clause,
  LegalShell,
  LegalTable,
} from "@/components/legal/legal-shell";
import { legal, legalHref } from "@/lib/legal";

// Plain "Cookie Policy" — the root layout's title template ("%s — FeedBoard")
// already appends the brand suffix; including it here too would double it.
export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `Every cookie ${legal.product} sets, what it does and how long it lasts. We set no advertising or analytics cookies.`,
};

export default function CookiesPage() {
  return (
    <LegalShell
      slug="cookies"
      summary="Every cookie we set, what it does and how long it lasts. There are five, all of them needed to make the product work — we set no advertising or analytics cookies of our own, and feedback boards carry no ads at all."
    >
      <Clause n={1} heading="Why you don't see a consent banner">
        <p>
          Consent is required for cookies that are not necessary to provide the
          service you asked for — typically advertising, cross-site tracking and
          analytics. <strong>We do not use any of those.</strong> Every cookie
          below either keeps you signed in, protects a form, remembers a setting
          you chose, or limits vote abuse on a public board.
        </p>
        <p>
          If we ever add analytics or anything else non-essential, we will ask for
          your consent first and update this page.
        </p>
      </Clause>

      <Clause n={2} heading="Cookies we set">
        <LegalTable
          head={["Cookie", "Purpose", "Type", "Lifetime"]}
          rows={[
            [
              <code key="__Secure-authjs.session-token" className="text-xs">__Secure-authjs.session-token</code>,
              "Keeps you signed in. Scoped to our parent domain so one login also works on your workspace's public board subdomain. HttpOnly, so JavaScript cannot read it.",
              "Strictly necessary",
              "8 hours",
            ],
            [
              <code key="authjs.csrf-token" className="text-xs">authjs.csrf-token</code>,
              "Protects sign-in and sign-out requests against cross-site request forgery.",
              "Strictly necessary",
              "Session",
            ],
            [
              <code key="authjs.callback-url" className="text-xs">authjs.callback-url</code>,
              "Remembers which page to return you to after signing in.",
              "Strictly necessary",
              "Session",
            ],
            [
              <code key="i18next" className="text-xs">i18next</code>,
              "Remembers the language you picked so pages render in it on the server as well as the client.",
              "Functional",
              "1 year",
            ],
            [
              <code key="fb_guest_id" className="text-xs">fb_guest_id</code>,
              "A random identifier for visitors without an account. Gives your posts and comments one consistent pseudonymous identity on a board, and limits votes to one per browser per post. Contains no personal data.",
              "Strictly necessary",
              "1 year",
            ],
          ]}
        />
        <p>
          In development the session cookie is named{" "}
          <code className="text-xs">authjs.session-token</code> without the{" "}
          <code className="text-xs">__Secure-</code> prefix, because that prefix
          requires HTTPS.
        </p>
      </Clause>

      <Clause n={3} heading="Third-party cookies">
        <Bullets
          items={[
            <>
              <strong>Paddle</strong> — our payment provider and Merchant of
              Record. When you check out or open the billing portal, Paddle
              processes the payment and may set cookies for payment processing
              and fraud prevention. Those are governed by Paddle&rsquo;s privacy
              notice, not ours.
            </>,
            <>
              <strong>Cloudflare</strong> — our domains are served through
              Cloudflare, which may set a bot-management cookie (for example{" "}
              <code className="text-xs">__cf_bm</code>) to distinguish humans from
              automated traffic. It is used for security, not tracking or
              advertising.
            </>,
            <>
              <strong>Ad&nbsp;Swap</strong> — our public marketing pages show one
              small advertisement for another independent site, loaded in an
              isolated frame from{" "}
              <code className="text-xs">ad-swap.web.app</code>. It is a
              reciprocal exchange between small sites, not an ad network: it
              receives no information from us and does not track you across
              sites, though as a separate site it may set cookies on its own
              domain, which we cannot read. It never appears on a feedback
              board — only on our own marketing pages.
            </>,
          ]}
        />
        <p>
          We embed no social widgets, advertising pixels or session-recording
          scripts, so no cookies are set by those.
        </p>
      </Clause>

      <Clause n={4} heading="Similar technologies">
        <p>
          Alongside cookies we store a small amount of data in your
          browser&rsquo;s <strong>localStorage</strong> — for example whether you
          have already voted on a post, so the button shows the right state
          immediately. It stays on your device, is not sent to us as a cookie, and
          clearing site data removes it.
        </p>
      </Clause>

      <Clause n={5} heading="Managing cookies">
        <Bullets
          items={[
            "You can delete or block cookies in your browser settings, or clear site data for our domain.",
            "Blocking the session cookie will sign you out and prevent you from signing in — it is the mechanism that keeps you authenticated.",
            "Blocking the language cookie means pages fall back to English.",
            "Blocking the visitor cookie means your submissions will not share one identity and vote limits will apply per visit rather than per browser.",
          ]}
        />
      </Clause>

      <Clause n={6} heading="More information">
        <p>
          How we handle the personal data behind these cookies — including your
          rights and how long we keep session and log records — is set out in the{" "}
          <Link href={legalHref("privacy")} className="font-medium text-[#c74959] hover:underline">
            Privacy Policy
          </Link>
          . Questions about this page can go to{" "}
          <a href={`mailto:${legal.privacyEmail}`} className="font-medium text-[#c74959] hover:underline">
            {legal.privacyEmail}
          </a>
          .
        </p>
      </Clause>
    </LegalShell>
  );
}
