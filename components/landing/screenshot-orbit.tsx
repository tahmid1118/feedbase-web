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
 * viewport once per revolution — a long, obvious dead stretch. Filling the
 * whole rim costs more DOM nodes but they resolve to the same four optimized
 * image URLs, so it is nodes rather than bytes.
 *
 * SIZING. Chord between neighbours is `2 * R * sin(STEP/2)`; at R=1500 and
 * STEP=12° that is ~314px, which is what sets the card width. Change one and
 * the other has to move with it or the cards collide (too narrow a chord) or
 * gap (too wide).
 *
 * The captioned, legible treatment of these same screenshots lives in
 * components/landing/product-proof.tsx. This one is atmosphere — it shows
 * there IS a real product, at the exact point in the page where most visitors
 * leave; the proof section is where they can actually read it.
 */

/**
 * Each shot is a full-page ~3816x1974 capture, and the interesting part sits
 * somewhere different in each one — the board's list is centred, the roadmap's
 * columns start at the left, the submit dialog is a centred modal. A single
 * shared crop therefore cannot work: aimed at the top-left it lands on header
 * whitespace for most of them, and the tiles come out blank.
 *
 * So each shot carries its own focal point. `left`/`top` are percentages of
 * the CARD width, chosen to put a ~900x1200px region of the original in frame
 * (see ZOOM below), and negative because they pull the oversized image up and
 * left behind the card's window.
 */
const SHOTS = [
  {
    src: "/board.png",
    alt: "A public FeedBoard feedback board with vote counts and status labels",
    left: "-131%",
    top: "-46%",
  },
  {
    src: "/anonymous-dialog.png",
    alt: "The feedback submit dialog, asking only for a title and an email",
    left: "-161%",
    top: "-46%",
  },
  {
    src: "/roadmap.png",
    alt: "A drag-and-drop product roadmap with Planned, In Progress and Completed columns",
    left: "-42%",
    top: "-16%",
  },
  {
    src: "/comments.png",
    alt: "A comment thread on a feedback post with a reply from the workspace owner",
    left: "-130%",
    top: "-30%",
  },
];

/**
 * Image width as a percentage of the card, i.e. how far in the crop zooms.
 * 424% puts roughly a 900px-wide slice of a 3816px capture in a 200px card —
 * enough that rows, status pills and the sidebar still read as software rather
 * than as grey texture.
 */
const ZOOM = "424%";

/** Degrees between neighbouring cards. COUNT below depends on this. */
const STEP = 10;
/** Full ring — see the note above on why this isn't just the visible arc. */
const COUNT = 360 / STEP;

export function ScreenshotOrbit() {
  return (
    <div
      aria-hidden
      // Radius and card size MUST scale together: the gap between neighbours is
      // the chord 2·R·sin(STEP/2), which at STEP=10° is 0.174·R, so a card wider
      // than ~0.16·R collides with the next one. Shrinking only the card would
      // also flatten the arc into a straight row on a phone — at R=1250 against
      // a 390px viewport there is essentially no visible curve. Both drop
      // together, which keeps the curve's character at every width.
      className="relative isolate mt-6 h-[220px] overflow-hidden [--orbit-card:120px] [--orbit-r:750px] sm:h-[300px] sm:[--orbit-card:160px] sm:[--orbit-r:1000px] lg:h-[400px] lg:[--orbit-card:200px] lg:[--orbit-r:1250px]"
      style={
        {
          "--orbit-duration": "140s",
          // Feathered edges, so cards leave the arc rather than being guillotined
          // by the container. Both properties: WebKit still wants the prefix.
          WebkitMaskImage:
            "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
          maskImage:
            "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
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
                  half of every card above the arc, where the container clips
                  — so the cards nearest the apex lost their tops. */}
              <div
                className="-translate-x-1/2 overflow-hidden rounded-xl border border-[#1c0a0c]/10 bg-white shadow-[0_1px_2px_rgba(28,10,12,0.05),0_10px_24px_-10px_rgba(28,10,12,0.18)]"
                style={{ width: "var(--orbit-card)" }}
              >
                {/* Portrait window onto a ZOOMED, per-shot crop — never the
                    whole capture. Fit a full-page 3800px screenshot entirely
                    into a 200px card and the UI degrades into grey texture. */}
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={860}
                    height={445}
                    // Pinned: without this Next would serve a 3840px variant of
                    // a 200px card, thirty-six times over.
                    sizes="860px"
                    className="absolute max-w-none"
                    style={{ width: ZOOM, left: shot.left, top: shot.top }}
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
