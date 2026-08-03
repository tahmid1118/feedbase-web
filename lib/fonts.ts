/**
 * Every typeface in the app, in one place.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TO CHANGE A FONT: edit ONE identifier in the import below. Nothing else.
 *
 *   import { Fraunces as DisplayFace } from "next/font/google";
 *                ^^^^^^^^ swap this for any Google font's export name
 *
 * The name is the font's family with spaces as underscores — "Playfair Display"
 * is `Playfair_Display`, "DM Serif Display" is `DM_Serif_Display`. Nothing
 * downstream refers to the font by name, so the swap is complete at that point:
 * `globals.css` reads the CSS variables, never the family.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Three roles, and what each one is for:
 *
 *   DisplayFace  headings — h1/h2, dialog and card titles, the wordmark.
 *   SansFace     body copy, form controls, buttons, table data, h3 and below,
 *                and anything else that inherits from <body> (e.g. the
 *                landing page's flow diagram, which sets no font of its own).
 *   MonoFace     code, API keys, and metadata (vote counts, status labels,
 *                section eyebrows) where tabular figures matter. Kept separate
 *                on purpose — it's a functional face, not a brand choice.
 *
 * CURRENT: single-family look. DisplayFace and SansFace are both IBM Plex
 * Sans, so headings and body read as one consistent voice everywhere —
 * buttons, forms, cards, the flow diagram, all of it. This is the "single
 * family" option this file used to only describe: two separate font calls
 * below, same family, so heading/body can still be re-split later by pointing
 * SansFace at something else.
 *
 * Vetted display alternatives if you want heading/body CONTRAST instead —
 * each is variable and pairs with a plain sans body face without muddying:
 *
 *   IBM_Plex_Sans       (current, used for both roles) grotesque with
 *                       squared-off terminals and a slight technical feel.
 *   Inter               neutral UI grotesque. Barely contrasts with most
 *                       sans body faces — near-single-family even when split.
 *   Fraunces            warm, quirky serif. Strong contrast against a sans body.
 *   Instrument_Serif    high-contrast editorial serif, more formal.
 *   Bricolage_Grotesque characterful sans if you want contrast without a serif.
 *   Playfair_Display    classic, sharper and more traditional than Fraunces.
 *
 * If the face you pick has variable axes worth setting (Fraunces' SOFT/WONK),
 * they live in ONE declaration — `--font-display-axes` in `globals.css`. A face
 * without those axes simply ignores the setting, so a swap needs no CSS change
 * unless you actively want different axis values.
 */
import {
  IBM_Plex_Sans as DisplayFace,
  JetBrains_Mono as MonoFace,
  IBM_Plex_Sans as SansFace,
} from "next/font/google";

export const fontDisplay = DisplayFace({
  variable: "--font-brand-display",
  // latin-ext is required, not optional: Polish (ą ć ę ł ń ś ź ż) and other
  // Latin Extended-A characters are NOT in the `latin` subset. Without it those
  // glyphs fall back to a system font mid-word — which the pl locale did for
  // every heading and every line of body copy.
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const fontSans = SansFace({
  variable: "--font-brand-sans",
  // latin-ext is required, not optional: Polish (ą ć ę ł ń ś ź ż) and other
  // Latin Extended-A characters are NOT in the `latin` subset. Without it those
  // glyphs fall back to a system font mid-word — which the pl locale did for
  // every heading and every line of body copy.
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const fontMono = MonoFace({
  variable: "--font-brand-mono",
  // latin-ext is required, not optional: Polish (ą ć ę ł ń ś ź ż) and other
  // Latin Extended-A characters are NOT in the `latin` subset. Without it those
  // glyphs fall back to a system font mid-word — which the pl locale did for
  // every heading and every line of body copy.
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/** Spread onto <html> so all three CSS variables are in scope app-wide. */
export const fontVariables = `${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable}`;
