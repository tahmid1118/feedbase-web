import { Check, X, MinusIcon } from "@/components/icons";

/**
 * How FeedBoard differs from Canny and UserJot.
 *
 * EVERY CELL HERE IS A VERIFIABLE CLAIM ABOUT A COMPETITOR, which makes this
 * the highest-risk section on the marketing site. The landing page just had a
 * false "thousands of teams" line removed for exactly this reason — a claim a
 * reader can check and disprove discredits every true claim beside it. So:
 *
 *  - Only facts sourced from the competitor's OWN public pages are stated.
 *    Verified 2026-08-15:
 *      · Canny help centre: "Canny does not allow for completely anonymous
 *        feedback", and "Anonymous boards are available on the Pro (or legacy
 *        Growth) and Business plans" — their anonymous mode is aliased users
 *        who still hold accounts, not account-free posting.
 *      · Canny pricing: Free = 25 tracked users ("a tracked user is any user
 *        associated with feedback"); Pro "starts at $79/month billed yearly".
 *      · UserJot FAQ: "Guest posting lets anyone submit without creating an
 *        account… Both are available on paid plans." Free plan has unlimited
 *        users and posts.
 *      · UserJot pricing: Free $0 · Starter $29 · Professional $59.
 *  - Nothing is characterised, ranked or editorialised. No "limited", no
 *    "expensive" — just what each product does, in its vendor's own terms.
 *  - `note` gives each competitor genuine credit, because a table that only
 *    flatters us reads as marketing and gets discounted wholesale.
 *
 * RE-VERIFY QUARTERLY. Competitor pricing and plan gating change without
 * notice, and a stale cell here is the same defect as the claim we removed.
 */

type Support = "yes" | "no" | "paid";

interface Row {
  label: string;
  feedboard: { state: Support; detail: string };
  canny: { state: Support; detail: string };
  userjot: { state: Support; detail: string };
}

function StateIcon({ state }: { state: Support }) {
  if (state === "yes") {
    return <Check className="h-4 w-4 shrink-0 text-[#2f6b53]" strokeWidth={2.25} aria-hidden />;
  }
  if (state === "no") {
    return <X className="h-4 w-4 shrink-0 text-[#1c0a0c]/30" strokeWidth={2.25} aria-hidden />;
  }
  return <MinusIcon className="h-4 w-4 shrink-0 text-[#c08a2e]" strokeWidth={2.25} aria-hidden />;
}

/** Screen-reader text for the icon, so the table isn't colour/glyph-only. */
function stateLabel(state: Support, t: (k: string) => string) {
  return state === "yes"
    ? t("landing.compare.stateYes")
    : state === "no"
      ? t("landing.compare.stateNo")
      : t("landing.compare.statePaid");
}

export function ComparisonTable({ t }: { t: (key: string) => string }) {
  const rows: Row[] = [
    {
      label: t("landing.compare.rowAccount"),
      feedboard: { state: "yes", detail: t("landing.compare.fbAccount") },
      canny: { state: "no", detail: t("landing.compare.cannyAccount") },
      userjot: { state: "paid", detail: t("landing.compare.ujAccount") },
    },
    {
      label: t("landing.compare.rowFree"),
      feedboard: { state: "yes", detail: t("landing.compare.fbFree") },
      canny: { state: "paid", detail: t("landing.compare.cannyFree") },
      userjot: { state: "yes", detail: t("landing.compare.ujFree") },
    },
    {
      label: t("landing.compare.rowAnon"),
      feedboard: { state: "yes", detail: t("landing.compare.fbAnon") },
      canny: { state: "paid", detail: t("landing.compare.cannyAnon") },
      userjot: { state: "paid", detail: t("landing.compare.ujAnon") },
    },
    {
      label: t("landing.compare.rowPrice"),
      feedboard: { state: "yes", detail: t("landing.compare.fbPrice") },
      canny: { state: "paid", detail: t("landing.compare.cannyPrice") },
      userjot: { state: "paid", detail: t("landing.compare.ujPrice") },
    },
  ];

  const cols = [
    { key: "feedboard" as const, name: "FeedBoard", own: true },
    { key: "canny" as const, name: "Canny", own: false },
    { key: "userjot" as const, name: "UserJot", own: false },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl leading-tight font-semibold text-balance text-[#1c0a0c] lg:text-5xl">
          {t("landing.compare.heading")}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[#1c0a0c]/65">
          {t("landing.compare.subheading")}
        </p>
      </div>

      {/* Wide content scrolls in its own container — the page body must never
          scroll sideways on a phone.

          `relative` is load-bearing, not decoration. The cells contain
          `sr-only` spans, which Tailwind implements as `position:absolute`,
          and an overflow container only clips absolutely-positioned
          descendants when it is itself their containing block. Without
          `relative` those spans resolve against the initial containing block,
          escape the scroller, and drag the whole document 128px wider than
          the viewport on a 390px screen — measured, and confirmed absent on
          the previous commit before this table existed. */}
      <div className="relative mt-12 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr>
              <th scope="col" className="w-[26%] pb-4 pr-4" />
              {cols.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`w-[24.6%] border-b-2 px-4 pb-3 align-bottom ${
                    c.own ? "border-[#c74959]" : "border-[#1c0a0c]/12"
                  }`}
                >
                  <span
                    className={`text-base font-semibold ${
                      c.own ? "text-[#c74959]" : "text-[#1c0a0c]/70"
                    }`}
                  >
                    {c.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="align-top">
                <th
                  scope="row"
                  className="border-b border-[#1c0a0c]/10 py-5 pr-4 text-[15px] font-medium text-[#1c0a0c]"
                >
                  {r.label}
                </th>
                {cols.map((c) => {
                  const cell = r[c.key];
                  return (
                    <td
                      key={c.key}
                      className={`border-b py-5 pl-4 pr-4 ${
                        c.own
                          ? "border-[#c74959]/25 bg-[#c74959]/[0.04]"
                          : "border-[#1c0a0c]/10"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <StateIcon state={cell.state} />
                        <span className="sr-only">{stateLabel(cell.state, t)}</span>
                        <span className="text-[15px] leading-snug text-[#1c0a0c]/70">
                          {cell.detail}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Credit row. A comparison that only flatters us reads as an ad;
                naming what each competitor is genuinely better at is what
                makes the rows above believable. */}
            <tr className="align-top">
              <th scope="row" className="py-5 pr-4 text-[15px] font-medium text-[#1c0a0c]">
                {t("landing.compare.rowBest")}
              </th>
              {cols.map((c) => (
                <td
                  key={c.key}
                  className={`py-5 pl-4 pr-4 ${c.own ? "bg-[#c74959]/[0.04]" : ""}`}
                >
                  <span className="text-[15px] leading-snug text-[#1c0a0c]/55 italic">
                    {t(`landing.compare.${c.key}Best`)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-[#1c0a0c]/45">
        {t("landing.compare.footnote")}
      </p>
    </section>
  );
}
