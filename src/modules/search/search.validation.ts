import { z } from "zod";
import { SEARCH_RESOURCE_TYPES, SearchResourceType } from "./search.types";

const singularTypeAliases: Record<string, SearchResourceType> = {
  project: "projects",
  task: "tasks",
  bug: "bugs",
  document: "documents",
  comment: "comments",
  activity: "activities",
  notification: "notifications",
  analytic: "analytics",
  analytics: "analytics",
  email: "emails",
  order: "orders",
  user: "users",
};

const normalizeSearchType = (type: string) => {
  const normalized = type.trim().toLowerCase();
  return singularTypeAliases[normalized] || normalized;
};

const parseTypeList = (value: unknown) => {
  if (typeof value === "string") {
    return value
      .split(",")
      .map(normalizeSearchType)
      .filter(Boolean);
  }

  return value;
};

const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query is required").max(120),
  limit: z.coerce.number().int().min(1).max(25).default(5),
  page: z.coerce.number().int().min(1).default(1),
  type: z.preprocess(parseTypeList, z.array(z.enum(SEARCH_RESOURCE_TYPES)).optional()),
  types: z
    .preprocess(parseTypeList, z.array(z.enum(SEARCH_RESOURCE_TYPES)).optional()),
}).transform((query) => {
  const types = query.types || query.type;

  return {
    q: query.q,
    limit: query.limit,
    page: query.page,
    skip: (query.page - 1) * query.limit,
    types,
  };
});

export { searchQuerySchema };
