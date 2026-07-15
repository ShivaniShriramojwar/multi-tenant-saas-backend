export interface CreateAnalyticsEventInput {
  userId?: string;
  eventName: string;
  entityType?: string;
  entityId?: string;
  properties?: Record<string, unknown>;
  occurredAt?: Date;
}

export interface AnalyticsEventListQuery {
  page: number;
  limit: number;
  skip: number;
  userId?: string;
  eventName?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export interface AnalyticsAggregateQuery {
  userId?: string;
  eventName?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export type AnalyticsTrendInterval = "hour" | "day" | "month";

export interface AnalyticsTrendQuery extends AnalyticsAggregateQuery {
  interval: AnalyticsTrendInterval;
}
