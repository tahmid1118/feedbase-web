"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";

export type SubdomainStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

/**
 * Debounced live check for whether a workspace subdomain is valid and free.
 * Returns "idle" while empty, "checking" while a request is in flight, then
 * "available" / "taken" / "invalid" from the backend.
 */
export function useSubdomainAvailability(
  subdomain: string,
  token: string | undefined
): SubdomainStatus {
  const [status, setStatus] = useState<SubdomainStatus>("idle");

  useEffect(() => {
    const value = subdomain.trim();
    if (!value || !token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("idle");
      return;
    }
    setStatus("checking");

    const timer = setTimeout(() => {
      usersApi
        .checkSubdomain(value, token)
        .then((res) => {
          const d = res.data;
          if (!d) return setStatus("idle");
          setStatus(!d.valid ? "invalid" : d.available ? "available" : "taken");
        })
        .catch(() => setStatus("idle"));
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomain, token]);

  return status;
}
