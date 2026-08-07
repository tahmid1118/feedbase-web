/**
 * Posts API service
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  Post,
  CreatePostData,
  PaginationData,
  PaginatedResponse,
  PostStatus,
  PostListFilters,
  DuplicateSuggestion,
  ModerationState,
} from "./types";

export const postsApi = {
  create: (data: CreatePostData, token: string) =>
    apiClient.post<ApiResponse<{ id: number }>>(
      "/posts/create",
      { postData: data },
      { token }
    ),

  getById: (id: number, token?: string) =>
    apiClient.post<ApiResponse<Post>>(
      `/posts/${id}`,
      { lg: "en" },
      { token }
    ),

  update: (id: number, data: Partial<CreatePostData>, token: string) =>
    apiClient.put<ApiResponse>(
      `/posts/update/${id}`,
      { postData: data },
      { token }
    ),

  delete: (id: number, token: string) =>
    apiClient.delete<ApiResponse>(`/posts/delete/${id}`, {}, { token }),

  list: (
    pagination: PaginationData,
    filters?: PostListFilters,
    token?: string
  ) =>
    apiClient.post<ApiResponse<PaginatedResponse<Post>>>(
      "/posts/list",
      { paginationData: pagination, filters },
      { token }
    ),

  updateStatus: (id: number, newStatus: PostStatus, token: string) =>
    apiClient.patch<ApiResponse>(
      `/posts/status/${id}`,
      { newStatus },
      { token }
    ),

  /**
   * Reclassify a post on the SPAM axis — the human override for the automatic
   * scorer. Separate from updateStatus because `status` is the pipeline and
   * syncs to the roadmap, whereas this only controls public visibility.
   * `"published"` also clears the score, so the post leaves the review queue.
   */
  updateModeration: (
    id: number,
    moderationState: ModerationState,
    token: string
  ) =>
    apiClient.patch<ApiResponse>(
      `/posts/moderation/${id}`,
      { moderationState },
      { token }
    ),

  /**
   * Email the submitter that their feedback is implemented (Pro+, owner-only,
   * post must be completed). Records the send server-side.
   */
  notifyImplemented: (id: number, token: string) =>
    apiClient.post<ApiResponse<{ emailSent: boolean }>>(
      `/posts/${id}/notify-implemented`,
      {},
      { token }
    ),

  /** Pin or unpin a post. Omit `isPinned` to toggle the current value. */
  pin: (id: number, token: string, isPinned?: boolean) =>
    apiClient.patch<ApiResponse<{ id: number; isPinned: boolean }>>(
      `/posts/pin/${id}`,
      isPinned === undefined ? {} : { isPinned },
      { token }
    ),

  /** Mark this post as a duplicate of another, or pass `null` to clear it. */
  markDuplicate: (id: number, duplicateOfPostId: number | null, token: string) =>
    apiClient.patch<ApiResponse>(
      `/posts/duplicate/${id}`,
      { duplicateOfPostId },
      { token }
    ),

  duplicateSuggestions: (id: number, token?: string) =>
    apiClient.post<ApiResponse<DuplicateSuggestion[]>>(
      `/posts/${id}/duplicate-suggestions`,
      { lg: "en" },
      { token }
    ),
};
