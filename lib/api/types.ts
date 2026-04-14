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
  created_at?: string;
}

export interface CreatePostData {
  title: string;
  description: string;
  postType: PostType;
  status?: PostStatus;
  priority?: number;
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
