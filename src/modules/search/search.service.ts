import {
  hasPermission,
} from "../../common/permissions/role-permissions";
import { AuthTokenPayload } from "../../common/interfaces/auth.interface";
import { searchRepository } from "./search.repository";
import {
  SEARCH_RESOURCE_PERMISSIONS,
  SEARCH_RESOURCE_TYPES,
  SearchQuery,
  SearchResourceType,
  SearchResponse,
} from "./search.types";

const getAllowedSearchTypes = (user: AuthTokenPayload) => {
  return SEARCH_RESOURCE_TYPES.filter((type) => {
    return hasPermission(user.role, SEARCH_RESOURCE_PERMISSIONS[type]);
  });
};

const searchService = async (
  user: AuthTokenPayload,
  query: SearchQuery,
): Promise<SearchResponse> => {
  const allowedTypes = getAllowedSearchTypes(user);
  const requestedTypes = query.types ?? allowedTypes;
  const searchableTypes = requestedTypes.filter((type): type is SearchResourceType => {
    return allowedTypes.includes(type);
  });

  const results = await searchRepository(
    user.tenantId,
    user.userId,
    query,
    searchableTypes,
  );

  const counts = Object.fromEntries(
    Object.entries(results).map(([type, items]) => [type, items.length]),
  ) as SearchResponse["counts"];

  const total = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);

  return {
    query: query.q,
    total,
    pagination: {
      page: query.page,
      limit: query.limit,
    },
    counts,
    results,
  };
};

export { searchService };
