import { Permission } from "../../common/permissions/role-permissions";

const SEARCH_RESOURCE_TYPES = [
  "projects",
  "tasks",
  "bugs",
  "documents",
  "comments",
  "activities",
  "notifications",
  "analytics",
  "emails",
  "orders",
  "users",
] as const;

type SearchResourceType = (typeof SEARCH_RESOURCE_TYPES)[number];

interface SearchQuery {
  q: string;
  limit: number;
  page: number;
  skip: number;
  types?: SearchResourceType[];
}

interface SearchResultItem {
  id: string;
  type: SearchResourceType;
  title: string;
  description?: string;
  status?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

type SearchResultsByType = Partial<Record<SearchResourceType, SearchResultItem[]>>;

interface SearchResponse {
  query: string;
  total: number;
  pagination: {
    page: number;
    limit: number;
  };
  counts: Partial<Record<SearchResourceType, number>>;
  results: SearchResultsByType;
}

const SEARCH_RESOURCE_PERMISSIONS: Record<SearchResourceType, Permission> = {
  projects: "view_project",
  tasks: "view_task",
  bugs: "view_bug",
  documents: "view_document",
  comments: "view_comment",
  activities: "view_activity",
  notifications: "view_notification",
  analytics: "view_analytics",
  emails: "view_email",
  orders: "view_orders",
  users: "manage_users",
};

export {
  SEARCH_RESOURCE_TYPES,
  SEARCH_RESOURCE_PERMISSIONS,
  SearchQuery,
  SearchResourceType,
  SearchResultItem,
  SearchResultsByType,
  SearchResponse,
};
