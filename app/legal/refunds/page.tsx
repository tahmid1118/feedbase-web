import type { Metadata } from "next";
import Link from "next/link";

import {
  Bullets,
  Clause,
  LegalShell,
} from "@/components/legal/legal-shell";
import { legal, legalHref } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Refund Policy — ${legal.product}`,
  description: `How cancellations, upgrades, downgrades and refunds work on ${legal.product}.`,
};

export default function RefundsPage() {
  return (
    <LegalShell
      slug="refunds"
      summary="Cancel whenever you like and keep your plan until the end of the period you already paid for. We don't bill you again after that, and we don't part-refund the remainder by default — but talk to us if something went wrong."
    >
      <Clause n={1} heading="How billing works">
        <Bullets
          items={[
            "Paid plans are billed in advance through Stripe, either monthly or yearly. Yearly is discounted against the monthly rate.",
            "A subscription belongs to your account and covers every workspace you own. You are not billed per workspace.",
            "The Free plan costs nothing and needs no payment method. You can stay on it indefinitely.",
            "Prices exclude taxes unless stated; any tax is calculated and collected at checkout.",
          ]}
        />
      </Clause>

      <Clause n={2} heading="Cancelling">
        <Bullets
          items={[
            "Cancel any time from Settings → Billing. No email required, no retention call.",
            "Cancelling stops future charges. You keep your paid features until the end of the period you have already paid for, then the account returns to the Free plan.",
            "Because you keep the service for the rest of the term, the remainder of that term is not refunded by default.",
            "You can resume before the period ends and nothing changes — same plan, same renewal date.",
            "Your content is not deleted when a subscription ends. Features that require a paid plan simply stop working, and limits such as seats apply again.",
          ]}
        />
      </Clause>

      <Clause n={3} heading="Changing plan mid-term">
        <Bullets
          items={[
            "Upgrading takes effect immediately and Stripe charges only the prorated difference for the time left in the period — the amount is shown before you confirm.",
            "Downgrading is scheduled for the end of the current period, so you keep what you paid for. No refund is issued for the difference, and you can cancel the scheduled change before it applies.",
            "Switching between monthly and yearly follows the same rule: to a longer term is an upgrade, to a shorter one is scheduled.",
          ]}
        />
      </Clause>

      {legal.refundWindowDays > 0 && (
        <Clause n={4} heading="When we will refund you">
          <p>
            Beyond your statutory rights, we would rather you were not out of
            pocket over a genuine mistake. Email{" "}
            <a href={`mailto:${legal.contactEmail}`} className="font-medium text-[#c74959] hover:underline">
              {legal.contactEmail}
            </a>{" "}
            within <strong>{legal.refundWindowDays} days</strong> of a charge and we
            will review it. We normally refund in full where:
          </p>
          <Bullets
            items={[
              "you were charged twice for the same period, or charged after cancelling;",
              "you subscribed by mistake and have not meaningfully used the paid features;",
              "a paid feature you subscribed for was substantially unavailable and we could not fix it;",
              "we materially reduced what your plan does during a term you had prepaid.",
            ]}
          />
          <p>
            We are unlikely to refund a term you have used in full, a yearly term
            cancelled months in, or a charge you are disputing only because you
            forgot to cancel — though we will always read the email before
            deciding.
          </p>
          <p>
            Approved refunds go back to the original payment method through Stripe,
            usually within 5–10 business days depending on your bank. We do not
            refund to a different method or as credit.
          </p>
        </Clause>
      )}

      <Clause n={legal.refundWindowDays > 0 ? 5 : 4} heading="Consumer rights">
        <p>
          If you bought as a consumer in the UK or EEA you normally have 14 days to
          withdraw from a distance contract. Because our service is delivered
          immediately, by subscribing and starting to use it you ask us to begin
          performance during that period — which means the right to withdraw ends
          once the service has been fully provided, and we may deduct a
          proportionate amount for what you used before cancelling.
        </p>
        <p>
          Nothing in this policy limits mandatory consumer protections where you
          live. If your local law gives you a stronger right than this page
          describes, that right applies.
        </p>
      </Clause>

      <Clause n={legal.refundWindowDays > 0 ? 6 : 5} heading="Failed payments">
        <Bullets
          items={[
            "If a renewal fails, Stripe retries it. We do not suspend you immediately.",
            "If it stays unpaid, the account drops to the Free plan and paid capabilities stop. Your content stays.",
            "Update the card from Settings → Billing → Manage billing and resubscribe whenever you are ready.",
          ]}
        />
      </Clause>

      <Clause n={legal.refundWindowDays > 0 ? 7 : 6} heading="Promotional prices, codes and complimentary plans">
        <Bullets
          items={[
            "Promotional prices and promo codes apply as described when you buy. A promotional rate applies for as long as stated and then reverts to the standard price for that plan and interval.",
            "A discounted purchase is refundable on the same basis as any other — up to the amount actually paid.",
            "We sometimes grant a paid plan at no charge. A complimentary plan involves no payment, so there is nothing to refund; it can be changed or ended at any time, and it does not create a Stripe subscription.",
          ]}
        />
      </Clause>

      <Clause n={legal.refundWindowDays > 0 ? 8 : 7} heading="Chargebacks">
        <p>
          Please contact us before raising a chargeback. A chargeback costs us a
          fee and freezes the disputed amount for weeks, and we can usually settle
          the matter the same day by email. Accounts with an unresolved chargeback
          may be suspended until it is closed.
        </p>
      </Clause>

      <Clause n={legal.refundWindowDays > 0 ? 9 : 8} heading="Related documents">
        <p>
          Billing obligations and account termination are covered by the{" "}
          <Link href={legalHref("terms")} className="font-medium text-[#c74959] hover:underline">
            Terms of Service
          </Link>
          ; what we do with billing data is in the{" "}
          <Link href={legalHref("privacy")} className="font-medium text-[#c74959] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Clause>
    </LegalShell>
  );
}
