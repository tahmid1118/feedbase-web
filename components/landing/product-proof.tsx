import Image from "next/image";

/**
 * Product proof — real screenshots of a live FeedBoard workspace (Bamboo
 * Hub), not the abstract flow diagram the page used to lead with. The audit's
 * single biggest finding: a visitor could read the entire page without ever
 * seeing what the product looks like. This section exists to fix exactly
 * that, in the fewest seconds possible.
 *
 * Deliberately static screenshots, not a live embedded board: this section
 * has to render instantly, above several other sections a visitor hasn't
 * committed to yet — an iframe's load delay and a layout this page doesn't
 * control are the wrong trade here. A live embed of the real board is a
 * reasonable follow-up, further down the page, once someone is already
 * convinced enough to look closer.
 *
 * Each shot is a genuine full-page capture (see public/board.png etc.), not a
 * cropped asset — cropping is done with CSS object-position instead of image
 * editing, so the source files stay honest, unedited screenshots. Position
 * differs per shot because the meaningful content sits in different places:
 * the list-based captures (board, roadmap, comments) put it at the top, but
 * the submit-dialog capture centers it, since the dialog is a modal over a
 * blurred backdrop rather than page content starting at y=0.
 */
function Shot({
  src,
  alt,
  position,
  caption,
}: {
  src: string;
  alt: string;
  position: "top" | "center";
  caption: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1c0a0c]/10 bg-white shadow-[0_1px_2px_rgba(28,10,12,0.04),0_12px_28px_-8px_rgba(28,10,12,0.12)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className={position === "top" ? "object-cover object-top" : "object-cover object-center"}
        />
      </div>
      <p className="border-t border-[#1c0a0c]/8 px-4 py-3 text-sm font-medium text-[#1c0a0c]/70">
        {caption}
      </p>
    </div>
  );
}

export function ProductProof({ t }: { t: (key: string) => string }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl leading-tight font-semibold text-balance text-[#1c0a0c] lg:text-5xl">
          {t("landing.proof.heading")}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[#1c0a0c]/65">
          {t("landing.proof.subheading")}
        </p>
      </div>

      {/* Hero shot, full width: the board itself, with real votes and real
          status pills, is the single most convincing image on the page. */}
      <div className="mt-12">
        <Shot
          src="/board.png"
          alt="A public feedback board, showing posts with vote counts and status labels like Planned, In Progress and Completed"
          position="top"
          caption={t("landing.proof.boardCaption")}
        />
      </div>

      {/* Three supporting shots. The submit dialog is placed first here on
          purpose — it is the visual proof of the page's actual headline
          claim, so it gets to lead the second row rather than trail it. */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Shot
          src="/anonymous-dialog.png"
          alt="The feedback submission dialog, showing only a title and an email field — no account or password required"
          position="center"
          caption={t("landing.proof.dialogCaption")}
        />
        <Shot
          src="/roadmap.png"
          alt="A drag-and-drop roadmap board with Planned, In Progress and Completed columns"
          position="top"
          caption={t("landing.proof.roadmapCaption")}
        />
        <Shot
          src="/comments.png"
          alt="A comment thread on a feedback post, with a reply from a verified account owner"
          position="top"
          caption={t("landing.proof.commentsCaption")}
        />
      </div>
    </section>
  );
}
