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
}

export interface PaginatedResponse<T> {
  metadata?: { totalRows: number };
  total?: number;
  [key: string]: T[] | unknown;
}

// Post types
export type PostType = "feedback" | "feature_request" | "bug_report";
export type PostStatus = "open" | "planned" | "in_progress" | "completed" | "closed";

export interface Post {
  id: number;
  title: string;
  description: string;
  post_type: PostType;
  status: PostStatus;
  priority: number;
  author_name: string;
  author_email: string;
  vote_count: number;
  comment_count: number;
  is_pinned?: number;
  duplicate_of_post_id?: number | null;
  tags?: Tag[];
  has_voted?: boolean;
  created_at?: string;
}

export interface CreatePostData {
  title: string;
  description: string;
  postType: PostType;
  status?: PostStatus;
  priority?: number;
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
  author_id: number;
  body: string;
  is_edited: number;
  author_name: string;
  author_email: string;
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
export type UserRole = "visitor" | "user" | "moderator" | "admin" | "owner";

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
}

export interface BillingStatus {
  planName: PlanKey;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
  limits: PlanLimits;
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
