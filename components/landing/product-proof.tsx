import { ProductSlideshow, type Slide } from "@/components/landing/product-slideshow";

/**
 * Product proof — real screenshots of a live FeedBoard workspace (Bamboo Hub),
 * not the abstract flow diagram the page used to lead with. The audit's single
 * biggest finding: a visitor could read the entire page without ever seeing
 * what the product looks like.
 *
 * Presented as a slideshow rather than a grid. The first cut put one full-width
 * hero shot above a three-up thumbnail row, and the thumbnails failed: a
 * ~340px tile of a 3800px full-page capture is illegible, so three of the four
 * screenshots were decoration. One full-width slide at a time is the only
 * layout at which every screenshot is actually readable, which is the whole
 * point of the section.
 *
 * This stays a Server Component so the copy is translated here, with the
 * already-translated strings handed to the client carousel — the interactivity
 * needs client state, the translation does not.
 */
export function ProductProof({ t }: { t: (key: string) => string }) {
  const slides: Slide[] = [
    {
      src: "/board.png",
      alt: "A public feedback board, showing posts with vote counts and status labels like Planned, In Progress and Completed",
      caption: t("landing.proof.boardCaption"),
    },
    {
      src: "/anonymous-dialog.png",
      alt: "The feedback submission dialog, showing only a title and an email field — no account or password required",
      caption: t("landing.proof.dialogCaption"),
    },
    {
      src: "/roadmap.png",
      alt: "A drag-and-drop roadmap board with Planned, In Progress and Completed columns",
      caption: t("landing.proof.roadmapCaption"),
    },
    {
      src: "/comments.png",
      alt: "A comment thread on a feedback post, with a reply from a verified account owner",
      caption: t("landing.proof.commentsCaption"),
    },
  ];

  return (
    // Wider than the page's usual max-w-6xl: legibility is this section's only
    // job, and these are dense captures of small UI text, so the extra ~130px
    // of column width is worth the small break in rhythm.
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl leading-tight font-semibold text-balance text-[#1c0a0c] lg:text-5xl">
          {t("landing.proof.heading")}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[#1c0a0c]/65">
          {t("landing.proof.subheading")}
        </p>
      </div>

      <ProductSlideshow
        slides={slides}
        prevLabel={t("common.previous")}
        nextLabel={t("common.next")}
      />
    </section>
  );
}
