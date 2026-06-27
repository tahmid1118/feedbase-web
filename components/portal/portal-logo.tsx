"use client";

import { useEffect, useRef, useState } from "react";

interface PortalLogoProps {
  logoUrl?: string | null;
  name: string;
  brand: string;
}

/**
 * Tenant logo for the public portal. Shows the uploaded logo, and falls back to
 * the company initial on a brand-colored tile if there's no logo or it fails to
 * load (e.g. a broken/removed URL).
 */
export function PortalLogo({ logoUrl, name, brand }: PortalLogoProps) {
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // The <img> is server-rendered, so it can finish loading (and fail) before
  // React hydrates and attaches onError — which would leave a broken-image icon
  // forever. Detect that already-failed case on mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      // Fires once for an already-broken image; the perf rule doesn't apply.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrored(true);
    }
  }, [logoUrl]);

  const showImage = logoUrl && !errored;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={imgRef}
        src={logoUrl}
        alt={name}
        width={32}
        height={32}
        onError={() => setErrored(true)}
        className="h-8 w-8 rounded-lg object-cover"
      />
    );
  }

  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
      style={{ backgroundColor: brand }}
      aria-label={name}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
