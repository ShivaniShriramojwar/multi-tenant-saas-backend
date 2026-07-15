import { NotFoundError } from "../errors/app-error";
import { getPaginationMeta } from "./pagination.util";
import { getObjectIdString } from "./object-id.util";

interface TenantScopedEntity {
  tenantId?: unknown;
}

interface PaginationQuery {
  page: number;
  limit: number;
}

const getEntityTenantId = (entity: TenantScopedEntity | null | undefined) => {
  return getObjectIdString(entity?.tenantId);
};

const createNotFoundError = (entityName: string) => {
  return new NotFoundError(`${entityName} not found`);
};

const assertSameTenant = <T extends TenantScopedEntity>(
  entity: T | null | undefined,
  tenantId: string,
  entityName: string,
) => {
  if (!entity || getEntityTenantId(entity) !== tenantId) {
    throw createNotFoundError(entityName);
  }

  return entity;
};

const buildPaginationResponse = <T>(
  data: T[],
  query: PaginationQuery,
  total: number,
) => {
  return {
    data,
    pagination: getPaginationMeta(query.page, query.limit, total),
  };
};

export {
  getEntityTenantId,
  assertSameTenant,
  createNotFoundError,
  buildPaginationResponse,
};
