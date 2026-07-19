/**
 * Flat-design character illustrations, hand-built as inline SVG.
 *
 * WHY INLINE SVG rather than stock artwork: illustration packs carry licences we
 * would have to honour and ship as binary assets. These are geometry only —
 * roughly 1KB each, tinted from the brand palette via props, crisp at any size,
 * and free of any third-party rights. They also inherit the page's colours, so
 * the infographic can never drift from the design system.
 *
 * The style is deliberately simple ("corporate flat"): circular heads, rounded
 * torsos, no faces. Faceless figures read as *anyone* — which is the point when
 * the same illustration has to stand for a tenant's end users in one scene and
 * their product team in the next.
 */

export type PersonTone = {
  /** Hair / shoe colour. */
  hair: string;
  /** Shirt colour — the figure's dominant tone. */
  shirt: string;
  /** Trousers colour. */
  pants: string;
  /** Skin tone. */
  skin: string;
};

/** Palette variants, all drawn from the brand ramp so scenes stay cohesive. */
export const TONES: Record<string, PersonTone> = {
  rose: { hair: "#3d1f24", shirt: "#c74959", pants: "#5b3138", skin: "#f0c8a8" },
  blush: { hair: "#4a2830", shirt: "#da6a78", pants: "#3d1f24", skin: "#e8b48f" },
  sand: { hair: "#2f1a1e", shirt: "#e399a3", pants: "#7a4149", skin: "#d9a179" },
  deep: { hair: "#2b1418", shirt: "#8f3644", pants: "#4a2830", skin: "#f3d3b5" },
};

type Props = {
  tone: PersonTone;
  /** Long hair reads as a different person without redrawing the body. */
  longHair?: boolean;
  /** Raises one arm — used for the "asking" and "celebrating" scenes. */
  armRaised?: boolean;
  className?: string;
};

export function FlatPerson({ tone, longHair, armRaised, className }: Props) {
  return (
    <svg
      viewBox="0 0 100 160"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      {/*
        Vertical layout (viewBox 0-160): head 7-37 · torso 40-94 · legs 92-136 ·
        shoes 131-140 · shadow 142. Each band OVERLAPS the next by a few units —
        butt-joining them leaves hairline gaps of background colour at the seams,
        which reads as a broken figure.
      */}
      {/* Contact shadow, sitting just under the soles so the figure is grounded. */}
      <ellipse cx="50" cy="142" rx="26" ry="4.5" fill="#1c0a0c" opacity="0.07" />

      {/* Legs — feet land at x 37-47 and 53-63. */}
      <path
        d="M34 92 h32 l-3 44 a5 5 0 0 1 -10 0 l-3 -30 -3 30 a5 5 0 0 1 -10 0 Z"
        fill={tone.pants}
      />
      {/* Shoes, aligned to those feet and splayed slightly outward. */}
      <rect x="31" y="131" width="18" height="9" rx="4.5" fill={tone.hair} />
      <rect x="51" y="131" width="18" height="9" rx="4.5" fill={tone.hair} />

      {/* Long hair sits BEHIND the torso so it drapes over the shoulders. */}
      {longHair && (
        <path
          d="M31 34 q-4 30 2 46 h12 q-8 -22 -4 -46 Z"
          fill={tone.hair}
          opacity="0.95"
        />
      )}

      {/* Torso */}
      <path
        d="M50 40 c-13 0 -20 8 -20 20 v34 h40 V60 c0 -12 -7 -20 -20 -20 Z"
        fill={tone.shirt}
      />

      {/* Arms */}
      {armRaised ? (
        <>
          {/* raised — a gesture of asking / celebrating */}
          <path
            d="M31 62 q-10 -12 -6 -26 a5 5 0 0 1 9 3 q-2 10 5 18 Z"
            fill={tone.shirt}
          />
          <circle cx="27" cy="34" r="5" fill={tone.skin} />
          <path d="M69 60 q9 10 8 24 a5 5 0 0 1 -10 0 q1 -12 -6 -20 Z" fill={tone.shirt} />
          <circle cx="72" cy="86" r="5" fill={tone.skin} />
        </>
      ) : (
        <>
          <path d="M31 60 q-9 10 -8 24 a5 5 0 0 0 10 0 q-1 -12 6 -20 Z" fill={tone.shirt} />
          <circle cx="28" cy="86" r="5" fill={tone.skin} />
          <path d="M69 60 q9 10 8 24 a5 5 0 0 1 -10 0 q1 -12 -6 -20 Z" fill={tone.shirt} />
          <circle cx="72" cy="86" r="5" fill={tone.skin} />
        </>
      )}

      {/* Neck + head */}
      <rect x="45" y="30" width="10" height="14" rx="4" fill={tone.skin} />
      <circle cx="50" cy="22" r="15" fill={tone.skin} />

      {/* Hair cap, drawn last so it sits over the head. */}
      <path
        d={
          longHair
            ? "M50 6 c-12 0 -19 8 -19 18 0 3 1 5 2 7 q3 -12 17 -12 t17 12 c1 -2 2 -4 2 -7 0 -10 -7 -18 -19 -18 Z"
            : "M50 6 c-11 0 -18 7 -18 16 q6 -7 18 -7 t18 7 c0 -9 -7 -16 -18 -16 Z"
        }
        fill={tone.hair}
      />
    </svg>
  );
}
