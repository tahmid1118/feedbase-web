"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { ArrowLeft, ArrowRight } from "@/components/icons";

export interface Slide {
  src: string;
  alt: string;
  caption: string;
}

/**
 * Full-width product screenshots, one at a time.
 *
 * This replaced a hero shot plus a three-up thumbnail row. The thumbnails were
 * the problem: a ~340px tile of a 3800px full-page capture is illegible, so the
 * two supporting screenshots were doing no work at all, and the submit dialog —
 * a modal over a blurred backdrop — read as a plain grey slab. One slide at a
 * time gives every screenshot the full column width, which is the only size at
 * which this UI is actually readable.
 *
 * Images are `object-contain` against white at the captures' own aspect ratio,
 * so nothing is ever cropped: the whole point is that a visitor can read the
 * board.
 *
 * All slides stay mounted and are cross-faded rather than swapped, so the
 * browser has decoded the next image before it is shown — a slideshow that
 * flashes white between slides looks broken. Inactive slides are
 * `aria-hidden` and taken out of the tab order so the carousel exposes only
 * the current one.
 *
 * Autoplay is a convenience, never a trap: it pauses on hover and on keyboard
 * focus, any manual navigation restarts the timer rather than fighting it, and
 * it does not run at all under `prefers-reduced-motion`, where the carousel
 * stays a plain manually-driven one.
 */
export function ProductSlideshow({
  slides,
  prevLabel,
  nextLabel,
}: {
  slides: Slide[];
  prevLabel: string;
  nextLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  // Autoplay is opt-IN on mount rather than opt-out: it starts disabled and is
  // only switched on after checking the motion preference, so the first frame
  // for a reduced-motion visitor is never an animating one.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setAutoplay(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Depends on `index` as well as the flags, so any manual navigation resets
  // the interval — otherwise a click could be followed almost immediately by
  // an automatic advance, which reads as the carousel ignoring the user.
  useEffect(() => {
    if (!autoplay || paused || count < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => window.clearInterval(id);
  }, [autoplay, paused, count, index]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    }
  };

  const regionRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={regionRef}
      className="mt-12"
      role="region"
      aria-roledescription="carousel"
      aria-label={slides[index]?.caption}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#1c0a0c]/10 bg-white shadow-[0_2px_6px_rgba(28,10,12,0.05),0_20px_44px_-20px_rgba(28,10,12,0.22)]">
        {/* The shots are all cropped to ~3:2 (see scripts note in the commit —
            the raw captures were full browser windows whose content filled only
            the middle ~38%, which is why they read as a small panel adrift in
            white). Matching that ratio here means object-contain never has to
            letterbox. */}
        <div className="relative aspect-[3/2] w-full">
          {slides.map((s, i) => (
            <div
              key={s.src}
              className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={i !== index}
            >
              <Image
                src={s.src}
                alt={s.alt}
                fill
                sizes="(min-width: 1280px) 1216px, 100vw"
                // Legibility is the entire job of this section, and these are
                // dense screenshots of small UI text — worth the extra bytes
                // over the default 75.
                quality={90}
                priority={i === 0}
                className="object-contain"
              />
            </div>
          ))}
        </div>

        {/* Controls sit on the image rather than below it, so the caption row
            underneath stays a single quiet line of prose. */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={prevLabel}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#1c0a0c]/10 bg-white/90 text-[#1c0a0c]/70 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-[#c74959] focus-visible:ring-2 focus-visible:ring-[#c74959] focus-visible:outline-none sm:left-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={nextLabel}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#1c0a0c]/10 bg-white/90 text-[#1c0a0c]/70 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-[#c74959] focus-visible:ring-2 focus-visible:ring-[#c74959] focus-visible:outline-none sm:right-4"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Polite live region: the caption is the only thing that tells a
            screen-reader user the slide changed. */}
        <p
          aria-live="polite"
          className="text-[15px] font-medium text-[#1c0a0c]/70"
        >
          {slides[index]?.caption}
        </p>

        {count > 1 && (
          <div className="flex shrink-0 items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => go(i)}
                aria-label={s.caption}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-[#c74959]"
                    : "w-2 bg-[#1c0a0c]/20 hover:bg-[#1c0a0c]/35"
                } focus-visible:ring-2 focus-visible:ring-[#c74959] focus-visible:ring-offset-2 focus-visible:outline-none`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
