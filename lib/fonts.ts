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
 *   DisplayFace  headings only — h1/h2, dialog and card titles, the wordmark.
 *                Wants personality; it is only ever seen large-ish and short.
 *   SansFace     body copy, form controls, buttons, table data, h3 and below.
 *                Wants to disappear. Don't put a display face here.
 *   MonoFace     code, API keys, and metadata (vote counts, status labels,
 *                section eyebrows) where tabular figures matter.
 *
 * Vetted display alternatives if you want to try another direction — each is
 * variable, has real character, and pairs with Sora without muddying:
 *
 *   IBM_Plex_Sans       (current) grotesque with squared-off terminals and a
 *                       slight technical feel. Contrasts with Sora more than
 *                       Inter does, though both are still sans.
 *   Inter               neutral UI grotesque. Nearly indistinguishable from
 *                       Sora at heading sizes — no contrast at all.
 *   Fraunces            warm, quirky serif. Strong contrast against Sora.
 *   Instrument_Serif    high-contrast editorial serif, more formal.
 *   Bricolage_Grotesque characterful sans, if you'd rather stay sans-only.
 *   Playfair_Display    classic, sharper and more traditional than Fraunces.
 *
 * A display face only earns its place if it CONTRASTS with the body face. If
 * you want a single-family look instead, set SansFace to the same font rather
 * than running two that look alike.
 *
 * If the face you pick has variable axes worth setting (Fraunces' SOFT/WONK),
 * they live in ONE declaration — `--font-display-axes` in `globals.css`. A face
 * without those axes simply ignores the setting, so a swap needs no CSS change
 * unless you actively want different axis values.
 */
import {
  IBM_Plex_Sans as DisplayFace,
  JetBrains_Mono as MonoFace,
  Sora as SansFace,
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
