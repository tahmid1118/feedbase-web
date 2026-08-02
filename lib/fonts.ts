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
 *   Fraunces            warm, quirky serif (current). Soft/wonk axes.
 *   Instrument_Serif    high-contrast editorial serif, more formal.
 *   Bricolage_Grotesque characterful sans, if you'd rather drop the serif.
 *   Playfair_Display    classic, sharper and more traditional than Fraunces.
 *
 * If the face you pick has variable axes worth setting (Fraunces' SOFT/WONK),
 * they live in ONE declaration — `--font-display-axes` in `globals.css`. A face
 * without those axes simply ignores the setting, so a swap needs no CSS change
 * unless you actively want different axis values.
 */
import {
  ZCOOL_XiaoWei as DisplayFace,
  JetBrains_Mono as MonoFace,
  Sora as SansFace,
} from "next/font/google";

export const fontDisplay = DisplayFace({
  variable: "--font-brand-display",
  subsets: ["latin"],
  display: "swap",
  // ZCOOL XiaoWei ships a single weight. Non-variable faces must declare it or
  // next/font fails the build — this is the one case the one-line swap needs a
  // second line.
  weight: "400",
});

export const fontSans = SansFace({
  variable: "--font-brand-sans",
  subsets: ["latin"],
  display: "swap",
});

export const fontMono = MonoFace({
  variable: "--font-brand-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Spread onto <html> so all three CSS variables are in scope app-wide. */
export const fontVariables = `${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable}`;
