/**
 * TypeScript types for Feedbase API
 */

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message: string;
  data?: T;
}

export interface PaginationData {
  itemsPerPage: number;
  currentPageNumber: number;
  sortOrder: "asc" | "desc";
  filterBy: string;
  /** Board sort (newest | oldest | most_voted | least_voted). Falls back to sortOrder. */
  sortBy?: BoardSort;
}

/** Board sort options, shared by the dashboard board and the public portal. */
export type BoardSort = "newest" | "oldest" | "most_voted" | "least_voted";

export const BOARD_SORT_OPTIONS: { value: BoardSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most_voted", label: "Most upvoted" },
  { value: "least_voted", label: "Least upvoted" },
];

export interface PaginatedResponse<T> {
  metadata?: { totalRows: number };
  total?: number;
  [key: string]: T[] | unknown;
}

// Post types
export type PostType = "feedback" | "feature_request" | "bug_report";
export type PostStatus = "open" | "planned" | "in_progress" | "completed" | "closed";

/** A photo or short video attached to a feedback post (Pro+ workspaces). */
export interface PostAttachment {
  id: number;
  kind: "image" | "video";
  /** Backend-relative path — pass through resolveUploadUrl before rendering. */
  url: string;
  mime_type: string;
  size_bytes?: number;
  original_name?: string | null;
}

export interface Post {
  id: number;
  title: string;
  description: string;
  post_type: PostType;
  status: PostStatus;
  priority: number;
  author_name: string;
  author_email: string;
  author_id?: number | null;
  author_avatar?: string | null;
  guest_id?: string | null;
  vote_count: number;
  comment_count: number;
  is_pinned?: number;
  duplicate_of_post_id?: number | null;
  tags?: Tag[];
  attachments?: PostAttachment[];
  /** Present on board-list rows (count only, not the attachments themselves). */
  attachment_count?: number;
  has_voted?: boolean;
  created_at?: string;
}

export interface CreatePostData {
  title: string;
  description: string;
  postType: PostType;
  status?: PostStatus;
  priority?: number;
  /** Ids of attachments uploaded via uploaderApi.uploadAttachment, to link. */
  attachmentIds?: number[];
}

export interface PostListFilters {
  status?: PostStatus;
  postType?: PostType;
  tagId?: number;
  search?: string;
}

// Vote types
export interface Vote {
  id: number;
  post_id: number;
  user_id: number;
  vote_type: string;
  full_name: string;
  email: string;
}

// Comment types
export interface Comment {
  id: number;
  post_id: number;
  author_id: number | null;
  body: string;
  is_edited: number;
  author_name: string;
  author_email: string;
  author_avatar?: string | null;
  guest_id?: string | null;
  parent_comment_id?: number | null;
  created_at?: string;
}

export interface CreateCommentData {
  postId: number;
  body: string;
  parentCommentId?: number | null;
}

// Tag types
export interface Tag {
  id: number;
  name: string;
  color_hex: string;
}

export interface CreateTagData {
  name: string;
  colorHex: string;
}

// Roadmap types
export interface RoadmapColumn {
  id: number;
  name: string;
  column_key: string;
  sort_order: number;
}

export interface RoadmapItem {
  id: number;
  post_id: number;
  roadmap_column_id: number;
  sort_order: number;
  target_release_date: string | null;
  title?: string;
  column_name?: string;
  status?: PostStatus;
  post_type?: PostType;
  vote_count?: number;
}

export interface CreateRoadmapItemData {
  postId: number;
  roadmapColumnId: number;
  sortOrder: number;
  targetReleaseDate?: string;
}

// Changelog types
export interface Changelog {
  id: number;
  title: string;
  summary: string;
  content: string;
  is_published: number;
  created_by_name: string;
  created_at?: string;
}

export interface CreateChangelogData {
  title: string;
  summary: string;
  content: string;
}

// Notification types
export type NotificationType = "post_status" | "comment_reply" | "mention" | "changelog" | "system";

export interface Notification {
  id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  reference_type?: string | null;
  reference_id?: number | null;
  is_read: number;
  created_at?: string;
}

// User types
// Tenant roles only. The platform operator ("admin") is a separate identity
// (see the admins table + session `isAdmin`), not a value here.
export type UserRole = "owner" | "user";

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  contact_no?: string;
  role?: UserRole;
  image_url?: string;
}

export interface PersonalData {
  user_id: number;
  tenant_id?: number;
  full_name: string;
  email: string;
  contact_no?: string;
  role?: UserRole;
  avatar_url?: string | null;
}

export interface Workspace {
  user_id: number;
  role: UserRole;
  tenant_id: number;
  name: string;
  subdomain: string;
  branding_primary_color?: string | null;
  current: boolean;
}

/**
 * Per-account workspace caps, governed by the account's tier (the best plan
 * among the workspaces it owns). `ownLimit`/`joinLimit` are null when unlimited.
 */
export interface WorkspaceLimits {
  tier: PlanKey;
  ownedCount: number;
  memberCount: number;
  ownLimit: number | null;
  joinLimit: number | null;
  canCreate: boolean;
  canJoin: boolean;
}

export interface WorkspacesResponse {
  workspaces: Workspace[];
  limits: WorkspaceLimits;
}

/** What deleting the account would destroy. */
export interface AccountDeletionSummary {
  email: string;
  ownedWorkspaces: {
    id: number;
    name: string;
    memberCount: number;
    postCount: number;
  }[];
  memberWorkspaces: { id: number; name: string }[];
}

/** Auth payload returned when creating or switching a workspace. */
export interface WorkspaceAuth {
  token: string;
  user: {
    id: number;
    tenantId: number;
    role: string;
    fullName: string;
    email: string;
    imageUrl?: string | null;
  };
  tenant?: { id: number; name: string; subdomain: string };
}

export interface OAuthLoginData {
  provider: "google" | "github" | "microsoft";
  providerUserId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  tenantId?: number;
}

export interface DuplicateSuggestion {
  id: number;
  title: string;
  status: PostStatus;
  post_type: PostType;
  created_at?: string;
  vote_count: number;
}

export interface UpdateProfileData {
  userId: number;
  fullName: string;
  contact: string;
  avatarUrl?: string;
}

// Tenant types
export interface Tenant {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  custom_domain?: string | null;
  plan_name: string;
  branding_logo_url?: string | null;
  branding_primary_color?: string | null;
  is_active: number;
}

export interface UpdateTenantData {
  name?: string;
  customDomain?: string;
  brandingLogoUrl?: string;
  brandingPrimaryColor?: string;
  isActive?: number;
}

// Billing / subscription types
export type PlanKey = "free" | "pro" | "business";

export interface PlanLimits {
  seats: number;
  customDomain: boolean;
  integrations: boolean;
  deleteFeedback: boolean;
  /** May feedback posts carry photo/video attachments (Pro+). */
  attachments: boolean;
  /** May the account be signed in on several devices/browsers/tabs at once. */
  multiDevice: boolean;
}

export interface ActiveOffer {
  id: number;
  plan: string;
  originalPrice: number;
  offerPrice: number;
  percentOff: number;
  label: string | null;
  endsAt: string | null;
}

export interface BillingStatus {
  planName: PlanKey;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
  limits: PlanLimits;
  // Active promotional offers keyed by plan key ("pro" / "business").
  offers?: Record<string, ActiveOffer>;
}

// API Key types
export interface ApiKey {
  id: number;
  key_name: string;
  key_prefix: string;
  scopes: string;
  last_used_at?: string | null;
  expires_at?: string | null;
  is_revoked: number;
  created_at?: string;
}

export interface CreateApiKeyData {
  keyName: string;
  scopes: string[];
  expiresAt?: string;
}

export const API_KEY_SCOPES = [
  "read:posts",
  "write:posts",
  "read:analytics",
  "read:roadmap",
  "write:roadmap",
  "read:changelog",
  "write:changelog",
] as const;

// Audit log types
export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  metadata?: string | null;
  actor_name?: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
}

// Integration types
export type IntegrationType = "slack" | "discord" | "webhook" | "zapier";

export interface Integration {
  id: number;
  integration_type: IntegrationType;
  config: string;
  is_active: number;
  created_at?: string;
}

export interface CreateIntegrationData {
  integrationType: IntegrationType;
  config: Record<string, unknown>;
}

// File upload
export interface UploadResult {
  status: string;
  message: string;
  filePath: string;
}

// Analytics (POST /analytics/overview)
export interface AnalyticsTotals {
  totalPosts: number;
  pinnedPosts: number;
  totalVotes: number;
  totalComments: number;
  totalUsers: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  count: number;
}

export interface AnalyticsOverview {
  totals: AnalyticsTotals;
  statusCounts: Partial<Record<PostStatus, number>>;
  typeCounts: Partial<Record<PostType, number>>;
  trends: AnalyticsTrendPoint[];
}
