import Image from "next/image";

/**
 * The hero's product visual: real screenshots orbiting a very large circle
 * whose centre sits far below the viewport, so only the top of the arc shows.
 *
 * HOW IT WORKS. Each card is a child of a zero-size "slot" pinned to the
 * wheel's centre and pushed out to the rim with
 * `rotate(θ) translateY(-radius)`. Rotating the wheel therefore does two
 * things at once: it drifts the cards along the arc, and it gives each one the
 * tilt tangent to the circle at its position. The tilt is the geometry rather
 * than a per-card angle someone has to keep in sync, which is what keeps the
 * arc reading as one continuous curve instead of a row of individually
 * rotated cards.
 *
 * WHY THE RING IS FULLY POPULATED. `COUNT * STEP` is 360, deliberately. Cover
 * only the visible arc and the empty remainder of the ring parades through the
 * viewport once per revolution — a long, obvious dead stretch.
 *
 * WHY THE CARDS ARE THIS BIG, AND CROPPED THIS TIGHT. The reference this
 * imitates fans out photographs: dense, saturated, legible at thumbnail size.
 * These are screenshots of a mostly-white SaaS UI, which is the opposite, and
 * the first cut proved it — at 200px wide showing a whole 3800px page capture
 * the tiles read as blank pale paper. Two things fix that and both are
 * load-bearing:
 *
 *   1. Each shot is cropped to a ~1000px-wide region of the original chosen
 *      for DENSITY AND COLOUR — the run of feedback rows next to their status
 *      badges, the roadmap's pink column headers — not to a corner. A shared
 *      crop cannot work: the interesting part of each capture is somewhere
 *      different, and aimed uniformly it lands on header whitespace.
 *   2. Fewer, larger cards. Legibility beats abundance here; a dense fan of
 *      unreadable tiles is texture, and texture made of screenshots just looks
 *      like a mistake.
 *
 * The submit-dialog capture is deliberately NOT in this rotation. It's a modal
 * over a blurred backdrop, so any crop of it is largely flat grey, and it
 * landed as an ugly slab among the white cards. It's shown properly, at a size
 * where its "no account needed" point actually reads, in
 * components/landing/product-proof.tsx.
 */

/**
 * `lx` / `ly` are the crop's focal point, expressed as MULTIPLES OF THE CARD
 * WIDTH so the whole thing scales from one variable. Both must be
 * width-relative: a CSS percentage `top` resolves against the container's
 * HEIGHT, which would silently desync the vertical aim from the horizontal one
 * the moment the card's aspect ratio changed.
 */
const SHOTS = [
  {
    src: "/board.png",
    alt: "A public FeedBoard feedback board with vote counts and status labels",
    // The rows beside their coloured status badges — the densest, most
    // recognisable part of the product.
    lx: 1.6,
    ly: 0.4,
  },
  {
    src: "/roadmap.png",
    alt: "A drag-and-drop product roadmap with Planned, In Progress and Completed columns",
    // Starts at the left edge so the pink column headers are in frame.
    lx: 0.38,
    ly: 0.25,
  },
  {
    src: "/comments.png",
    alt: "A comment thread on a feedback post with a reply from the workspace owner",
    // The post header (green Completed badge) plus the thread below it.
    lx: 1.2,
    ly: 0.28,
  },
];

/** Degrees between neighbouring cards. COUNT depends on this; 360 % STEP must be 0. */
const STEP = 12;
/** Full ring — see the note above on why this isn't just the visible arc. */
const COUNT = 360 / STEP;
/**
 * Image width as a multiple of the card width, i.e. how far the crop zooms.
 * 3.81 puts a ~1000px-wide slice of a 3816px capture in frame.
 */
const ZOOM = 3.81;

export function ScreenshotOrbit() {
  return (
    <div
      aria-hidden
      // Radius and card size MUST scale together: the gap between neighbours is
      // the chord 2·R·sin(STEP/2), which at STEP=12° is 0.209·R, so a card wider
      // than ~0.2·R collides with the next one. Shrinking only the card would
      // also flatten the arc into a straight row on a phone — at R=1400 against
      // a 390px viewport there is essentially no visible curve.
      className="relative isolate mt-6 h-[230px] overflow-hidden [--orbit-card:140px] [--orbit-r:700px] sm:h-[300px] sm:[--orbit-card:200px] sm:[--orbit-r:1000px] lg:h-[400px] lg:[--orbit-card:280px] lg:[--orbit-r:1400px]"
      style={
        {
          "--orbit-duration": "150s",
          // Feathered edges, so cards leave the arc rather than being
          // guillotined by the container. Kept narrow (6%) — a wide fade washed
          // the outer cards out to near-white, which was half of why the first
          // cut looked so pale.
          WebkitMaskImage:
            "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
          maskImage:
            "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
        } as React.CSSProperties
      }
    >
      {/* The wheel. Its top edge is the arc's apex, so the circle's centre is
          one radius below that — far off-screen, which is what makes the
          visible slice read as a gentle curve rather than a circle. */}
      <div
        className="lp-orbit-wheel absolute left-1/2 top-0"
        style={{
          width: "calc(var(--orbit-r) * 2)",
          height: "calc(var(--orbit-r) * 2)",
          marginLeft: "calc(var(--orbit-r) * -1)",
        }}
      >
        {Array.from({ length: COUNT }, (_, i) => {
          const shot = SHOTS[i % SHOTS.length];
          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `rotate(${i * STEP}deg) translateY(calc(var(--orbit-r) * -1))` }}
            >
              {/* Only -translate-x-1/2: the card HANGS from its point on the
                  rim rather than straddling it. Centring it vertically put
                  half of every card above the arc, where the container clips —
                  so the cards nearest the apex lost their tops. */}
              <div
                className="-translate-x-1/2 overflow-hidden rounded-xl border border-[#1c0a0c]/12 bg-white shadow-[0_2px_4px_rgba(28,10,12,0.06),0_14px_30px_-12px_rgba(28,10,12,0.22)]"
                style={{ width: "var(--orbit-card)" }}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={1080}
                    height={559}
                    // Pinned: without this Next would serve a 3840px variant of
                    // a 280px card, thirty times over.
                    sizes="1080px"
                    className="absolute max-w-none"
                    style={{
                      width: `calc(var(--orbit-card) * ${ZOOM})`,
                      left: `calc(var(--orbit-card) * ${-shot.lx})`,
                      top: `calc(var(--orbit-card) * ${-shot.ly})`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
