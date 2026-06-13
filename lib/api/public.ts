/**
 * Public portal API client.
 *
 * These endpoints are unauthenticated and scoped to a tenant resolved from its
 * subdomain (or custom domain). They are called from Server Components in the
 * `app/portal` route group, so they use a plain server-side fetch with no token.
 */

import type {
  Post,
  Comment,
  RoadmapColumn,
  RoadmapItem,
  Changelog,
  PostListFilters,
} from "./types";

const API_BASE_URL =
  process.env.FEEDBASE_API_BASE_URL ||
  process.env.NEXT_PUBLIC_FEEDBASE_API_BASE_URL ||
  "http://localhost:4560";

export interface PublicTenant {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  custom_domain?: string | null;
  branding_logo_url?: string | null;
  branding_primary_color?: string | null;
}

export interface PublicPostDetail extends Post {
  comments: Comment[];
}

export interface PublicRoadmap {
  columns: RoadmapColumn[];
  items: RoadmapItem[];
}

interface ApiEnvelope<T> {
  status: string;
  message: string;
  data?: T;
}

async function publicFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiEnvelope<T>;
    return json.data ?? null;
  } catch {
    return null;
  }
}

const body = (payload: Record<string, unknown> = {}) =>
  JSON.stringify({ lg: "en", ...payload });

export const publicApi = {
  /** Resolve a tenant by subdomain or custom domain. Returns null if unknown. */
  getTenant: (identifier: string) =>
    publicFetch<PublicTenant>(
      `/public/tenant?subdomain=${encodeURIComponent(identifier)}`
    ),

  getBoard: (
    identifier: string,
    filters?: PostListFilters,
    itemsPerPage = 100
  ) =>
    publicFetch<{ posts: Post[]; total: number }>(
      `/public/${encodeURIComponent(identifier)}/posts`,
      {
        method: "POST",
        body: body({
          paginationData: {
            itemsPerPage,
            currentPageNumber: 0,
            sortOrder: "desc",
            filterBy: "",
          },
          filters,
        }),
      }
    ),

  getPost: (identifier: string, postId: number | string) =>
    publicFetch<PublicPostDetail>(
      `/public/${encodeURIComponent(identifier)}/posts/${postId}`,
      { method: "POST", body: body() }
    ),

  getRoadmap: (identifier: string) =>
    publicFetch<PublicRoadmap>(
      `/public/${encodeURIComponent(identifier)}/roadmap`,
      { method: "POST", body: body() }
    ),

  getChangelogList: (identifier: string) =>
    publicFetch<{ changelogs: Changelog[]; total: number }>(
      `/public/${encodeURIComponent(identifier)}/changelog`,
      {
        method: "POST",
        body: body({
          paginationData: {
            itemsPerPage: 50,
            currentPageNumber: 0,
            sortOrder: "desc",
            filterBy: "",
          },
        }),
      }
    ),

  getChangelog: (identifier: string, changelogId: number | string) =>
    publicFetch<Changelog>(
      `/public/${encodeURIComponent(identifier)}/changelog/${changelogId}`,
      { method: "POST", body: body() }
    ),
};
