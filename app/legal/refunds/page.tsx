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
  description: `${legal.product} does not offer refunds. How cancellation, plan changes and billing corrections work instead.`,
};

export default function RefundsPage() {
  return (
    <LegalShell
      slug="refunds"
      summary="Payments are final and we do not issue refunds. You can cancel at any time to stop future charges, and you keep the plan until the end of the period you have already paid for."
    >
      <Clause n={1} heading="Position">
        <p>
          <strong>
            All charges are final. We do not issue refunds, in whole or in part,
            for any subscription period that has been paid for.
          </strong>{" "}
          This applies whether the period was billed monthly or yearly, and
          whether or not the service was used during it.
        </p>
        <p>
          Cancelling stops the <em>next</em> charge. It does not reverse a charge
          already taken, and it does not shorten or partly refund the period you
          are currently in.
        </p>
      </Clause>

      <Clause n={2} heading="Evaluate before you pay">
        <p>
          Because paid periods are non-refundable, we keep a permanently free
          plan. The Free plan requires no payment method and no trial period: you
          can create a workspace, publish a public board, collect feedback, run a
          roadmap and a changelog, and decide whether the product suits you before
          any money changes hands. Paid plans add capacity and capability, not
          basic function.
        </p>
        <p>
          We recommend testing on the Free plan first, and choosing a monthly term
          before committing to a yearly one.
        </p>
      </Clause>

      <Clause n={3} heading="How billing works">
        <Bullets
          items={[
            "Paid plans are billed in advance for the whole period, monthly or yearly, through Paddle, our Merchant of Record. Access is granted for the period you paid for.",
            "A subscription belongs to your account and covers every workspace you own. Billing is per account, not per workspace, and not per seat.",
            "Renewal is automatic at the end of each period, at the then-current price for your plan and interval, until you cancel.",
            "Prices exclude taxes unless stated. Any tax is calculated and collected at checkout.",
          ]}
        />
      </Clause>

      <Clause n={4} heading="Cancelling, precisely">
        <p>
          Cancellation is self-service, in Settings → Billing. Technically it marks
          the subscription to end at the close of the current billing period rather
          than terminating it immediately, which has these consequences:
        </p>
        <Bullets
          items={[
            "No further charges are made after the cancellation takes effect.",
            "Your plan, its features and its limits remain fully available until the period end date, which is shown on the billing card.",
            "At that date the account returns to the Free plan. Paid capabilities stop and Free limits apply again.",
            "No proportion of the paid period is refunded, and the period is not shortened on request.",
            "You may resume before the period ends. The subscription simply continues — same plan, same renewal date, no new charge at that moment.",
            "Your content is not deleted by cancelling. Workspaces, posts, comments, roadmap and changelog remain; only paid features become unavailable.",
          ]}
        />
        <p>
          To avoid a renewal charge, cancel <strong>before</strong> the renewal
          date. A cancellation entered after a renewal has been charged applies to
          the following period, and the charge already taken is not refunded.
        </p>
      </Clause>

      <Clause n={5} heading="Changing plan mid-period">
        <Bullets
          items={[
            "Upgrading takes effect immediately. Paddle charges only the prorated difference for the remainder of the current period; the exact amount is shown for confirmation before you agree to it. That charge is final on the same terms as any other.",
            "Downgrading takes effect at the end of your current paid period. You keep your current plan until then, and the lower plan applies afterward at its own price. You are not charged for the change, and no refund arises for the remainder of the current period. You can cancel the scheduled change before it takes effect.",
            "Switching between monthly and yearly: moving to the longer term is treated as an upgrade and charged pro rata. Moving to the shorter term is scheduled for the end of your current period — you keep the term you paid for, nothing is refunded for it, and billing on the shorter term begins on that date.",
          ]}
        />
      </Clause>

      <Clause n={6} heading="Specifically not refundable">
        <p>For the avoidance of doubt, we do not refund:</p>
        <Bullets
          items={[
            "unused time remaining after a cancellation;",
            "periods in which you did not use the service, or used only part of it;",
            "a renewal you intended to cancel but did not cancel in time;",
            "seats, workspaces or attachment capacity included in your plan but left unused;",
            "a yearly term cancelled part-way through;",
            "a period during which you deleted a workspace, deleted your account, or lost access through a breach of the Terms of Service;",
            "the prorated amount charged for a mid-period upgrade;",
            "purchases made at a promotional price or with a promo code.",
          ]}
        />
      </Clause>

      <Clause n={7} heading="Billing corrections">
        <p>
          A billing error is not a refund request and is treated separately. If our
          systems charge you incorrectly, we will correct it. That means:
        </p>
        <Bullets
          items={[
            "a duplicate charge for the same account and the same period;",
            "a charge taken after a cancellation had already taken effect;",
            "a charge for a plan or interval other than the one you selected and confirmed;",
            "a charge to an account with no corresponding subscription.",
          ]}
        />
        <p>
          Report a suspected error to{" "}
          <a href={`mailto:${legal.contactEmail}`} className="font-medium text-[#c74959] hover:underline">
            {legal.contactEmail}
          </a>{" "}
          with the date and amount. Verified errors are reversed to the original
          payment method through Paddle, usually within 5–10 business days
          depending on your bank. Dissatisfaction with the product, a change of
          mind, or a renewal you forgot to cancel are not billing errors.
        </p>
      </Clause>

      <Clause n={8} heading="Your statutory rights">
        <p>
          Nothing in this policy removes rights you have by law. Where mandatory
          consumer law gives you a right to cancel or to a refund, that right
          applies regardless of the position stated above.
        </p>
        <p>
          In particular, if you purchase as a consumer in the UK or EEA you
          ordinarily have 14 days to withdraw from a distance contract. Our service
          is supplied immediately on subscribing: by subscribing and using it you
          expressly request performance during that period and acknowledge that
          the right to withdraw is lost once the service has been fully supplied.
          Where you withdraw before that point, we may retain a proportionate
          amount for what was supplied up to then.
        </p>
        <p>
          If you believe a mandatory right applies to your situation, write to{" "}
          <a href={`mailto:${legal.contactEmail}`} className="font-medium text-[#c74959] hover:underline">
            {legal.contactEmail}
          </a>{" "}
          setting out the circumstances and we will assess it on that basis.
        </p>
      </Clause>

      <Clause n={9} heading="If we change or withdraw a paid feature">
        <p>
          If we materially reduce what a paid plan does during a period you have
          already paid for, the Terms of Service entitle you to cancel and to a
          refund of the unused portion of that prepaid term. That is a specific
          remedy for our change to the service, and is the one circumstance in
          which a partial refund is issued as a matter of policy.
        </p>
      </Clause>

      <Clause n={10} heading="Failed payments">
        <Bullets
          items={[
            "If a renewal fails, Paddle retries it according to its standard schedule. We do not suspend access on the first failure.",
            "If the charge remains unpaid, the account drops to the Free plan and paid capabilities stop. Your content is retained.",
            "Update the card from Settings → Billing → Manage billing and resubscribe when you are ready. No charge is made for the lapsed period, and none is owed for it.",
          ]}
        />
      </Clause>

      <Clause n={11} heading="Promotional prices and complimentary plans">
        <Bullets
          items={[
            "Promotional prices and promo codes apply as described at the point of purchase, for as long as stated, after which the standard price for that plan and interval applies at renewal.",
            "A discounted purchase is non-refundable on the same terms as a full-price one.",
            "We sometimes grant a paid plan at no charge. A complimentary plan creates no payment and therefore nothing to refund; it may be changed or ended at any time.",
          ]}
        />
      </Clause>

      <Clause n={12} heading="Chargebacks">
        <p>
          Contact us before raising a chargeback. A chargeback withholds the
          disputed amount for weeks, incurs a fee, and is resolved by the same
          evidence you would send us directly. Where a chargeback is raised against
          a charge that is valid under this policy, we will contest it, and the
          account may be suspended until the dispute closes.
        </p>
      </Clause>

      <Clause n={13} heading="Related documents">
        <p>
          Billing obligations, plan limits and termination are set out in the{" "}
          <Link href={legalHref("terms")} className="font-medium text-[#c74959] hover:underline">
            Terms of Service
          </Link>
          . What we do with billing data — and what Paddle holds rather than us —
          is in the{" "}
          <Link href={legalHref("privacy")} className="font-medium text-[#c74959] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Clause>
    </LegalShell>
  );
}
