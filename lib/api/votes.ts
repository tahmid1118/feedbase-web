/**
 * Votes API service — READ ONLY.
 *
 * Upvoting is a public-board-only action: the workspace's own owner/team must not
 * vote on their users' feedback, so there is no authenticated add/remove vote
 * call (nor a backend endpoint for one). Visitors vote from the portal via
 * `components/portal/portal-vote-button.tsx` → `POST /public/:tenant/posts/:id/vote`.
 * The dashboard only ever displays `vote_count`.
 */

import { apiClient } from "./client";
import type { ApiResponse, Vote } from "./types";

export const votesApi = {
  getByPost: (postId: number, token?: string) =>
    apiClient.post<ApiResponse<Vote[]>>(`/votes/post/${postId}`, { lg: "en" }, { token }),
};
