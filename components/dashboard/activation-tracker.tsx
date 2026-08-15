"use client";

import { useEffect } from "react";

import { trackOnce } from "@/lib/analytics";

/**
 * Fires the `first_feedback_received` activation event.
 *
 * WHY THIS IS THE ACTIVATION EVENT: a feedback board is worthless empty.
 * "Workspace created" is setup, not value — the moment the product proves
 * itself is when the owner sees real feedback from a real user land on their
 * board. That is the event worth optimising the whole funnel toward, and the
 * audit found it was not being measured at all.
 *
 * Observed rather than pushed: the dashboard already knows the workspace's
 * total post count, so the transition out of "empty" is detectable here
 * without a backend change. `trackOnce` keys the guard on the tenant, so it
 * reports once per workspace per browser — an owner reloading their dashboard
 * must not inflate the activation number the funnel is judged on, and an
 * owner with two workspaces should get an event for each.
 *
 * Renders nothing.
 */
export function ActivationTracker({
  totalPosts,
  tenantId,
}: {
  totalPosts: number;
  tenantId?: string | null;
}) {
  useEffect(() => {
    if (totalPosts < 1 || !tenantId) return;
    trackOnce("first_feedback_received", tenantId, { posts: totalPosts });
  }, [totalPosts, tenantId]);

  return null;
}
