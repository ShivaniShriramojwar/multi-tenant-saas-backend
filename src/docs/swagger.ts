type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type Operation = {
  tags: string[];
  summary: string;
  description?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: unknown[];
  requestBody?: unknown;
  responses: Record<string, unknown>;
};

const objectId = {
  type: "string",
  pattern: "^[a-fA-F0-9]{24}$",
  example: "64f8a2e2c19f6b4f3a8f4d11",
};

const dateTime = {
  type: "string",
  format: "date-time",
  example: "2026-07-15T10:30:00.000Z",
};

const PROJECT_STATUSES = ["ACTIVE", "COMPLETED", "ON_HOLD"];
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"];
const BUG_STATUSES = ["OPEN", "IN_PROGRESS", "FIXED", "VERIFIED", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const USER_ROLES = [
  "super_admin",
  "head_product_manager",
  "team_lead",
  "developer",
  "tester",
];
const ENTITY_TYPES = ["PROJECT", "TASK", "BUG", "ORDER", "COMMENT"];
const DOCUMENT_CATEGORIES = [
  "PRODUCT_REQUIREMENT",
  "ARCHITECTURE_DIAGRAM",
  "UI_DESIGN",
  "CLIENT_DOCUMENT",
  "PROJECT_PLAN",
  "API_SPECIFICATION",
  "IMPLEMENTATION_SCREENSHOT",
  "OUTPUT_FILE",
  "TECHNICAL_NOTE",
  "TEST_DATA",
  "BUG_SCREENSHOT",
  "SCREEN_RECORDING",
  "CONSOLE_LOG",
  "NETWORK_LOG",
  "REPRODUCTION_FILE",
  "INVOICE",
  "PAYMENT_PROOF",
  "ORDER_ATTACHMENT",
  "CONTRACT",
  "RECEIPT",
  "OTHER",
];
const NOTIFICATION_PRIORITIES = ["low", "normal", "high"];
const NOTIFICATION_CHANNELS = ["in_app", "email"];
const SEARCH_TYPES = [
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
];

const jsonContent = (schema: unknown, example?: unknown) => ({
  "application/json": {
    schema,
    ...(example ? { example } : {}),
  },
});

const multipartContent = (schema: unknown) => ({
  "multipart/form-data": {
    schema,
  },
});

const body = (schemaRef: string, required = true) => ({
  required,
  content: jsonContent({ $ref: schemaRef }),
});

const multipartBody = (schemaRef: string) => ({
  required: true,
  content: multipartContent({ $ref: schemaRef }),
});

const response = (description: string, schemaRef?: string, example?: unknown) => ({
  description,
  ...(schemaRef
    ? {
        content: jsonContent({ $ref: schemaRef }, example),
      }
    : {}),
});

const ok = (schemaRef: string, description = "Successful response") =>
  response(description, schemaRef);

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: objectId,
  description: "MongoDB ObjectId.",
};

const q = (name: string, schema: unknown, description?: string, example?: unknown) => ({
  name,
  in: "query",
  required: false,
  schema,
  ...(description ? { description } : {}),
  ...(example ? { example } : {}),
});

const paginationParams = [
  q("page", { type: "integer", minimum: 1, default: 1 }, "Page number.", 1),
  q("limit", { type: "integer", minimum: 1, maximum: 100, default: 10 }, "Items per page.", 10),
];

const authErrors = {
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { $ref: "#/components/responses/Forbidden" },
};

const commonErrors = {
  "400": { $ref: "#/components/responses/BadRequest" },
  ...authErrors,
  "404": { $ref: "#/components/responses/NotFound" },
  "429": { $ref: "#/components/responses/RateLimited" },
  "500": { $ref: "#/components/responses/InternalError" },
};

const secured = (operation: Omit<Operation, "security">): Operation => ({
  security: [{ bearerAuth: [] }],
  ...operation,
});

const makeCrudPaths = (options: {
  tag: string;
  base: string;
  singular: string;
  createSchema: string;
  updateSchema: string;
  itemSchema: string;
  listSchema: string;
  filters?: unknown[];
}) => ({
  [options.base]: {
    post: secured({
      tags: [options.tag],
      summary: `Create ${options.singular}`,
      requestBody: body(options.createSchema),
      responses: {
        "201": ok(options.itemSchema, `${options.singular} created`),
        ...commonErrors,
      },
    }),
    get: secured({
      tags: [options.tag],
      summary: `List ${options.tag.toLowerCase()}`,
      parameters: [...paginationParams, ...(options.filters || [])],
      responses: {
        "200": ok(options.listSchema, `${options.tag} fetched`),
        ...commonErrors,
      },
    }),
  },
  [`${options.base}/{id}`]: {
    get: secured({
      tags: [options.tag],
      summary: `Get ${options.singular} by ID`,
      parameters: [idParam],
      responses: {
        "200": ok(options.itemSchema),
        ...commonErrors,
      },
    }),
    put: secured({
      tags: [options.tag],
      summary: `Update ${options.singular}`,
      parameters: [idParam],
      requestBody: body(options.updateSchema),
      responses: {
        "200": ok(options.itemSchema, `${options.singular} updated`),
        ...commonErrors,
      },
    }),
    delete: secured({
      tags: [options.tag],
      summary: `Delete ${options.singular}`,
      parameters: [idParam],
      responses: {
        "200": ok("#/components/schemas/DeleteResponse", `${options.singular} deleted`),
        ...commonErrors,
      },
    }),
  },
});

const paths: Record<string, Partial<Record<HttpMethod, Operation>>> = {
  "/api/v1/auth/register": {
    post: {
      tags: ["Authentication"],
      summary: "Register a tenant and initial user",
      requestBody: body("#/components/schemas/RegisterRequest"),
      responses: {
        "201": ok("#/components/schemas/AuthResponse", "User registered successfully"),
        "400": { $ref: "#/components/responses/BadRequest" },
        "409": { $ref: "#/components/responses/Conflict" },
        "429": { $ref: "#/components/responses/RateLimited" },
        "500": { $ref: "#/components/responses/InternalError" },
      },
    },
  },
  "/api/v1/auth/login": {
    post: {
      tags: ["Authentication"],
      summary: "Login and receive JWT tokens",
      requestBody: body("#/components/schemas/LoginRequest"),
      responses: {
        "200": ok("#/components/schemas/AuthResponse", "Login successful"),
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "429": { $ref: "#/components/responses/RateLimited" },
        "500": { $ref: "#/components/responses/InternalError" },
      },
    },
  },
  "/api/v1/auth/refresh": {
    post: {
      tags: ["Authentication"],
      summary: "Refresh access token",
      requestBody: body("#/components/schemas/RefreshTokenRequest"),
      responses: {
        "200": ok("#/components/schemas/TokenResponse", "Token refreshed successfully"),
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/InternalError" },
      },
    },
  },
  "/api/v1/auth/logout": {
    post: {
      tags: ["Authentication"],
      summary: "Logout using a refresh token",
      requestBody: body("#/components/schemas/RefreshTokenRequest"),
      responses: {
        "200": ok("#/components/schemas/MessageResponse", "Logout successful"),
        "400": { $ref: "#/components/responses/BadRequest" },
        "500": { $ref: "#/components/responses/InternalError" },
      },
    },
  },
  "/api/v1/auth/sessions": {
    get: secured({
      tags: ["Authentication"],
      summary: "List active sessions",
      responses: {
        "200": ok("#/components/schemas/SessionsResponse", "Sessions fetched successfully"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/auth/sessions/{id}": {
    delete: secured({
      tags: ["Authentication"],
      summary: "Revoke a session",
      parameters: [idParam],
      responses: {
        "200": ok("#/components/schemas/MessageResponse", "Session revoked successfully"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/users/profile": {
    get: secured({
      tags: ["Users"],
      summary: "Get current user profile",
      responses: {
        "200": ok("#/components/schemas/ProfileResponse", "Profile fetched successfully"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/users/profile/image": {
    post: secured({
      tags: ["Users"],
      summary: "Upload current user's profile image",
      requestBody: multipartBody("#/components/schemas/ProfileImageUploadRequest"),
      responses: {
        "200": ok("#/components/schemas/UserResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/users": {
    get: secured({
      tags: ["Users"],
      summary: "List users",
      parameters: [
        ...paginationParams,
        q("search", { type: "string", minLength: 1 }, "Search by user name or email."),
        q("role", { type: "string", enum: USER_ROLES }, "Filter by role."),
      ],
      responses: {
        "200": ok("#/components/schemas/UserListResponse"),
        ...commonErrors,
      },
    }),
    post: secured({
      tags: ["Users"],
      summary: "Create user",
      requestBody: body("#/components/schemas/CreateUserRequest"),
      responses: {
        "201": ok("#/components/schemas/UserResponse", "User created"),
        ...commonErrors,
        "409": { $ref: "#/components/responses/Conflict" },
      },
    }),
  },
  "/api/v1/users/{id}": {
    delete: secured({
      tags: ["Users"],
      summary: "Delete user",
      parameters: [idParam],
      responses: {
        "200": ok("#/components/schemas/DeleteResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/users/{id}/role": {
    patch: secured({
      tags: ["Users"],
      summary: "Update user role",
      parameters: [idParam],
      requestBody: body("#/components/schemas/UpdateUserRoleRequest"),
      responses: {
        "200": ok("#/components/schemas/UserResponse"),
        ...commonErrors,
      },
    }),
  },
  ...makeCrudPaths({
    tag: "Projects",
    base: "/api/v1/projects",
    singular: "project",
    createSchema: "#/components/schemas/CreateProjectRequest",
    updateSchema: "#/components/schemas/UpdateProjectRequest",
    itemSchema: "#/components/schemas/ProjectResponse",
    listSchema: "#/components/schemas/ProjectListResponse",
    filters: [
      q("search", { type: "string", minLength: 1 }),
      q("status", { type: "string", enum: PROJECT_STATUSES }),
    ],
  }),
  ...makeCrudPaths({
    tag: "Tasks",
    base: "/api/v1/tasks",
    singular: "task",
    createSchema: "#/components/schemas/CreateTaskRequest",
    updateSchema: "#/components/schemas/UpdateTaskRequest",
    itemSchema: "#/components/schemas/TaskResponse",
    listSchema: "#/components/schemas/TaskListResponse",
    filters: [
      q("search", { type: "string", minLength: 1 }),
      q("status", { type: "string", enum: TASK_STATUSES }),
      q("priority", { type: "string", enum: PRIORITIES }),
      q("projectId", objectId),
      q("assignedTo", objectId),
    ],
  }),
  "/api/v1/tasks/{id}/assign": {
    patch: secured({
      tags: ["Tasks"],
      summary: "Assign task to a user",
      parameters: [idParam],
      requestBody: body("#/components/schemas/AssignRequest"),
      responses: {
        "200": ok("#/components/schemas/TaskResponse"),
        ...commonErrors,
        "409": { $ref: "#/components/responses/Conflict" },
      },
    }),
  },
  "/api/v1/tasks/{id}/status": {
    patch: secured({
      tags: ["Tasks"],
      summary: "Update task status",
      parameters: [idParam],
      requestBody: body("#/components/schemas/UpdateTaskStatusRequest"),
      responses: {
        "200": ok("#/components/schemas/TaskResponse"),
        ...commonErrors,
      },
    }),
  },
  ...makeCrudPaths({
    tag: "Bugs",
    base: "/api/v1/bugs",
    singular: "bug",
    createSchema: "#/components/schemas/CreateBugRequest",
    updateSchema: "#/components/schemas/UpdateBugRequest",
    itemSchema: "#/components/schemas/BugResponse",
    listSchema: "#/components/schemas/BugListResponse",
    filters: [
      q("search", { type: "string", minLength: 1 }),
      q("status", { type: "string", enum: BUG_STATUSES }),
      q("severity", { type: "string", enum: PRIORITIES }),
      q("projectId", objectId),
      q("taskId", objectId),
      q("assignedTo", objectId),
      q("reportedBy", objectId),
    ],
  }),
  "/api/v1/bugs/{id}/assign": {
    patch: secured({
      tags: ["Bugs"],
      summary: "Assign bug to a user",
      parameters: [idParam],
      requestBody: body("#/components/schemas/AssignRequest"),
      responses: {
        "200": ok("#/components/schemas/BugResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/bugs/{id}/status": {
    patch: secured({
      tags: ["Bugs"],
      summary: "Update bug status",
      parameters: [idParam],
      requestBody: body("#/components/schemas/UpdateBugStatusRequest"),
      responses: {
        "200": ok("#/components/schemas/BugResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/bugs/{id}/severity": {
    patch: secured({
      tags: ["Bugs"],
      summary: "Update bug severity",
      parameters: [idParam],
      requestBody: body("#/components/schemas/UpdateBugSeverityRequest"),
      responses: {
        "200": ok("#/components/schemas/BugResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/comments": {
    post: secured({
      tags: ["Comments"],
      summary: "Create comment",
      requestBody: multipartBody("#/components/schemas/CreateCommentRequest"),
      responses: {
        "201": ok("#/components/schemas/CommentResponse"),
        ...commonErrors,
      },
    }),
    get: secured({
      tags: ["Comments"],
      summary: "List comments",
      parameters: [
        ...paginationParams,
        q("entityType", { type: "string", enum: ENTITY_TYPES }),
        q("entityId", objectId),
        q("createdBy", objectId),
        q("search", { type: "string", minLength: 1 }),
      ],
      responses: {
        "200": ok("#/components/schemas/CommentListResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/comments/{id}": {
    get: secured({
      tags: ["Comments"],
      summary: "Get comment by ID",
      parameters: [idParam],
      responses: { "200": ok("#/components/schemas/CommentResponse"), ...commonErrors },
    }),
    put: secured({
      tags: ["Comments"],
      summary: "Update comment",
      parameters: [idParam],
      requestBody: body("#/components/schemas/UpdateCommentRequest"),
      responses: { "200": ok("#/components/schemas/CommentResponse"), ...commonErrors },
    }),
    delete: secured({
      tags: ["Comments"],
      summary: "Delete comment",
      parameters: [idParam],
      responses: { "200": ok("#/components/schemas/DeleteResponse"), ...commonErrors },
    }),
  },
  "/api/v1/documents": {
    post: secured({
      tags: ["Documents"],
      summary: "Upload documents",
      requestBody: multipartBody("#/components/schemas/UploadDocumentRequest"),
      responses: {
        "201": ok("#/components/schemas/DocumentUploadResponse"),
        ...commonErrors,
      },
    }),
    get: secured({
      tags: ["Documents"],
      summary: "List documents",
      parameters: [
        ...paginationParams,
        q("search", { type: "string", minLength: 1 }),
        q("category", { type: "string", enum: DOCUMENT_CATEGORIES }),
        q("entityType", { type: "string", enum: ENTITY_TYPES }),
        q("entityId", objectId),
        q("projectId", objectId),
        q("taskId", objectId),
        q("bugId", objectId),
        q("orderId", objectId),
        q("uploadedBy", objectId),
        q("mimeType", { type: "string" }),
      ],
      responses: {
        "200": ok("#/components/schemas/DocumentListResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/documents/{id}": {
    get: secured({
      tags: ["Documents"],
      summary: "Get document by ID",
      parameters: [idParam],
      responses: { "200": ok("#/components/schemas/DocumentResponse"), ...commonErrors },
    }),
    put: secured({
      tags: ["Documents"],
      summary: "Update document metadata",
      parameters: [idParam],
      requestBody: body("#/components/schemas/UpdateDocumentRequest"),
      responses: { "200": ok("#/components/schemas/DocumentResponse"), ...commonErrors },
    }),
    delete: secured({
      tags: ["Documents"],
      summary: "Delete document",
      parameters: [idParam],
      responses: { "200": ok("#/components/schemas/DeleteResponse"), ...commonErrors },
    }),
  },
  "/api/v1/documents/{id}/download-url": {
    get: secured({
      tags: ["Documents"],
      summary: "Get signed document download URL",
      parameters: [idParam],
      responses: {
        "200": ok("#/components/schemas/DocumentDownloadResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/documents/{id}/download": {
    get: secured({
      tags: ["Documents"],
      summary: "Get document download URL",
      parameters: [idParam],
      responses: {
        "200": ok("#/components/schemas/DocumentDownloadResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/notifications": {
    post: secured({
      tags: ["Notifications"],
      summary: "Create notification",
      requestBody: body("#/components/schemas/CreateNotificationRequest"),
      responses: {
        "201": ok("#/components/schemas/NotificationResponse"),
        ...commonErrors,
      },
    }),
    get: secured({
      tags: ["Notifications"],
      summary: "List notifications",
      parameters: [
        ...paginationParams,
        q("readStatus", { type: "string", enum: ["all", "read", "unread"] }),
        q("archived", { type: "boolean" }),
        q("priority", { type: "string", enum: NOTIFICATION_PRIORITIES }),
        q("type", { type: "string" }),
        q("entityType", { type: "string" }),
        q("entityId", { type: "string" }),
        q("search", { type: "string" }),
      ],
      responses: {
        "200": ok("#/components/schemas/NotificationListResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/notifications/unread-count": {
    get: secured({
      tags: ["Notifications"],
      summary: "Get unread notification count",
      responses: {
        "200": ok("#/components/schemas/UnreadNotificationCountResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/notifications/read-all": {
    patch: secured({
      tags: ["Notifications"],
      summary: "Mark all notifications as read",
      responses: {
        "200": ok("#/components/schemas/MessageResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/notifications/{id}": {
    get: secured({
      tags: ["Notifications"],
      summary: "Get notification by ID",
      parameters: [idParam],
      responses: { "200": ok("#/components/schemas/NotificationResponse"), ...commonErrors },
    }),
    delete: secured({
      tags: ["Notifications"],
      summary: "Delete notification",
      parameters: [idParam],
      responses: { "200": ok("#/components/schemas/DeleteResponse"), ...commonErrors },
    }),
  },
  "/api/v1/notifications/{id}/read": {
    patch: secured({
      tags: ["Notifications"],
      summary: "Mark notification as read",
      parameters: [idParam],
      responses: { "200": ok("#/components/schemas/NotificationResponse"), ...commonErrors },
    }),
  },
  "/api/v1/notifications/{id}/archive": {
    patch: secured({
      tags: ["Notifications"],
      summary: "Archive notification",
      parameters: [idParam],
      responses: { "200": ok("#/components/schemas/NotificationResponse"), ...commonErrors },
    }),
  },
  "/api/v1/search": {
    get: secured({
      tags: ["Search"],
      summary: "Search across resources",
      parameters: [
        q("q", { type: "string", minLength: 1, maxLength: 120 }, "Search term.", "api"),
        q("page", { type: "integer", minimum: 1, default: 1 }),
        q("limit", { type: "integer", minimum: 1, maximum: 25, default: 5 }),
        q("type", { type: "array", items: { type: "string", enum: SEARCH_TYPES } }, "Comma-separated or repeated resource types."),
        q("types", { type: "array", items: { type: "string", enum: SEARCH_TYPES } }, "Alias for type."),
      ],
      responses: {
        "200": ok("#/components/schemas/SearchResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/reports/projects": reportOperation("Projects report"),
  "/api/v1/reports/tasks": reportOperation("Tasks report"),
  "/api/v1/reports/bugs": reportOperation("Bugs report"),
  "/api/v1/reports/team-workload": reportOperation("Team workload report"),
  "/api/v1/reports/orders": reportOperation("Orders report"),
  "/api/v1/reports/audit": reportOperation("Audit report"),
  "/api/v1/analytics/events": {
    post: secured({
      tags: ["Analytics"],
      summary: "Create analytics event",
      requestBody: body("#/components/schemas/CreateAnalyticsEventRequest"),
      responses: {
        "201": ok("#/components/schemas/AnalyticsEventResponse"),
        ...commonErrors,
      },
    }),
    get: secured({
      tags: ["Analytics"],
      summary: "List analytics events",
      parameters: [
        ...paginationParams,
        q("userId", { type: "string" }),
        q("eventName", { type: "string" }),
        q("entityType", { type: "string" }),
        q("entityId", { type: "string" }),
        q("fromDate", { type: "string", format: "date" }),
        q("toDate", { type: "string", format: "date" }),
        q("search", { type: "string" }),
      ],
      responses: {
        "200": ok("#/components/schemas/AnalyticsEventListResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/analytics/events/{id}": {
    get: secured({
      tags: ["Analytics"],
      summary: "Get analytics event by ID",
      parameters: [idParam],
      responses: {
        "200": ok("#/components/schemas/AnalyticsEventResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/analytics/summary": {
    get: secured({
      tags: ["Analytics"],
      summary: "Get analytics summary",
      parameters: analyticsAggregateParams(),
      responses: {
        "200": ok("#/components/schemas/AnalyticsSummaryResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/analytics/trend": {
    get: secured({
      tags: ["Analytics"],
      summary: "Get analytics trend",
      parameters: [
        ...analyticsAggregateParams(),
        q("interval", { type: "string", enum: ["hour", "day", "month"], default: "day" }),
      ],
      responses: {
        "200": ok("#/components/schemas/AnalyticsTrendResponse"),
        ...commonErrors,
      },
    }),
  },
  "/api/v1/analytics/top-events": {
    get: secured({
      tags: ["Analytics"],
      summary: "Get top analytics events",
      parameters: [
        ...analyticsAggregateParams(),
        q("limit", { type: "integer", minimum: 1, maximum: 50, default: 10 }),
      ],
      responses: {
        "200": ok("#/components/schemas/TopAnalyticsEventsResponse"),
        ...commonErrors,
      },
    }),
  },
};

function reportOperation(summary: string) {
  return {
    get: secured({
      tags: ["Reports"],
      summary,
      parameters: [
        q("fromDate", { type: "string", format: "date" }),
        q("toDate", { type: "string", format: "date" }),
        q("format", { type: "string", enum: ["json", "csv", "excel", "pdf"], default: "json" }),
        q("upload", { type: "boolean", default: false }, "Upload generated report as a document."),
      ],
      responses: {
        "200": ok("#/components/schemas/ReportResponse"),
        ...commonErrors,
      },
    }),
  };
}

function analyticsAggregateParams() {
  return [
    q("userId", { type: "string" }),
    q("eventName", { type: "string" }),
    q("entityType", { type: "string" }),
    q("entityId", { type: "string" }),
    q("fromDate", { type: "string", format: "date" }),
    q("toDate", { type: "string", format: "date" }),
  ];
}

const baseEntity = {
  type: "object",
  properties: {
    _id: objectId,
    tenantId: objectId,
    createdAt: dateTime,
    updatedAt: dateTime,
  },
};

const wrapped = (dataSchema: unknown) => ({
  type: "object",
  properties: {
    message: { type: "string", example: "Request completed successfully" },
    data: dataSchema,
  },
});

const paged = (itemRef: string) =>
  wrapped({
    type: "object",
    properties: {
      data: { type: "array", items: { $ref: itemRef } },
      pagination: { $ref: "#/components/schemas/PaginationMeta" },
    },
  });

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Backend SaaS API",
    version: "1.0.0",
    description:
      "OpenAPI documentation for authentication, users, projects, tasks, bugs, comments, documents, notifications, search, reports, and analytics.",
  },
  servers: [
    {
      url: process.env.API_BASE_URL || "/",
      description: process.env.API_BASE_URL ? "Configured API server" : "Current API server",
    },
  ],
  tags: [
    { name: "Authentication", description: "Registration, login, token refresh, logout, and sessions." },
    { name: "Users", description: "Tenant users, roles, profiles, and profile images." },
    { name: "Projects", description: "Project management." },
    { name: "Tasks", description: "Task management, assignment, and status updates." },
    { name: "Bugs", description: "Bug tracking, assignment, status, and severity updates." },
    { name: "Comments", description: "Entity comments and attachments." },
    { name: "Documents", description: "Document upload, metadata, filtering, and downloads." },
    { name: "Notifications", description: "In-app and email notification workflows." },
    { name: "Search", description: "Cross-resource search." },
    { name: "Reports", description: "Project, task, bug, team, order, and audit reports." },
    { name: "Analytics", description: "Analytics events, summaries, trends, and top events." },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Send the access token as `Authorization: Bearer <token>`.",
      },
    },
    responses: {
      BadRequest: response("Validation or malformed request error", "#/components/schemas/ErrorResponse", {
        message: "Validation failed",
        errors: [{ path: "email", message: "Invalid email address" }],
      }),
      Unauthorized: response("JWT token is missing, invalid, or expired", "#/components/schemas/ErrorResponse", {
        message: "Unauthorized",
      }),
      Forbidden: response("Authenticated user does not have the required permission", "#/components/schemas/ErrorResponse", {
        message: "Forbidden",
      }),
      NotFound: response("Resource not found", "#/components/schemas/ErrorResponse", {
        message: "Project not found",
      }),
      Conflict: response("Request conflicts with current resource state", "#/components/schemas/ErrorResponse", {
        message: "Project cannot be deleted while it has tasks or bugs",
        details: { tasks: 2, bugs: 1 },
      }),
      RateLimited: response("Too many requests", "#/components/schemas/ErrorResponse", {
        message: "Too many requests",
      }),
      InternalError: response("Unexpected server error", "#/components/schemas/ErrorResponse", {
        message: "Internal server error",
      }),
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                message: { type: "string" },
              },
            },
          },
          details: { type: "object", additionalProperties: true },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 5 },
          hasNextPage: { type: "boolean", example: true },
          hasPrevPage: { type: "boolean", example: false },
        },
      },
      MessageResponse: wrapped({ type: "object", additionalProperties: true }),
      DeleteResponse: wrapped({
        type: "object",
        properties: {
          id: objectId,
          deleted: { type: "boolean", example: true },
        },
      }),
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "tenantName"],
        properties: {
          name: { type: "string", minLength: 1, example: "Shivani Rao" },
          email: { type: "string", format: "email", example: "shivani@example.com" },
          password: { type: "string", minLength: 12, format: "password", example: "StrongPass123!" },
          tenantName: { type: "string", minLength: 1, example: "Acme SaaS" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "shivani@example.com" },
          password: { type: "string", format: "password", example: "StrongPass123!" },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", example: "refresh.jwt.token" },
        },
      },
      TokenPayload: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "access.jwt.token" },
          refreshToken: { type: "string", example: "refresh.jwt.token" },
        },
      },
      AuthResponse: wrapped({
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
          accessToken: { type: "string", example: "access.jwt.token" },
          refreshToken: { type: "string", example: "refresh.jwt.token" },
        },
      }),
      TokenResponse: wrapped({ $ref: "#/components/schemas/TokenPayload" }),
      Session: {
        allOf: [
          baseEntity,
          {
            type: "object",
            properties: {
              userId: objectId,
              userAgent: { type: "string", example: "Mozilla/5.0" },
              ipAddress: { type: "string", example: "127.0.0.1" },
              revokedAt: dateTime,
            },
          },
        ],
      },
      SessionsResponse: wrapped({ type: "array", items: { $ref: "#/components/schemas/Session" } }),
      User: {
        allOf: [
          baseEntity,
          {
            type: "object",
            properties: {
              name: { type: "string", example: "Shivani Rao" },
              email: { type: "string", format: "email", example: "shivani@example.com" },
              role: { type: "string", enum: USER_ROLES },
              profileImageUrl: { type: "string", format: "uri" },
              isActive: { type: "boolean", example: true },
            },
          },
        ],
      },
      AuthUser: {
        allOf: [
          { $ref: "#/components/schemas/User" },
          {
            type: "object",
            required: ["permissions"],
            properties: {
              permissions: {
                type: "array",
                items: { type: "string" },
                example: [
                  "manage_company",
                  "manage_users",
                  "manage_roles",
                  "view_dashboard",
                  "create_project",
                  "view_project",
                ],
              },
            },
          },
        ],
      },
      CreateUserRequest: {
        type: "object",
        required: ["name", "email", "password", "role"],
        properties: {
          name: { type: "string", minLength: 1 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 12, format: "password", example: "StrongPass123!" },
          role: { type: "string", enum: USER_ROLES },
        },
      },
      UpdateUserRoleRequest: {
        type: "object",
        required: ["role"],
        properties: { role: { type: "string", enum: USER_ROLES } },
      },
      ProfileImageUploadRequest: {
        type: "object",
        required: ["image"],
        properties: {
          image: { type: "string", format: "binary" },
        },
      },
      UserResponse: wrapped({ $ref: "#/components/schemas/User" }),
      ProfileResponse: wrapped({
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      }),
      UserListResponse: paged("#/components/schemas/User"),
      Project: {
        allOf: [
          baseEntity,
          {
            type: "object",
            properties: {
              name: { type: "string", example: "Client Portal" },
              description: { type: "string", example: "Build a client portal MVP." },
              status: { type: "string", enum: PROJECT_STATUSES },
              startDate: { type: "string", format: "date" },
              endDate: { type: "string", format: "date" },
              createdBy: objectId,
            },
          },
        ],
      },
      CreateProjectRequest: {
        type: "object",
        required: ["name", "description"],
        properties: {
          name: { type: "string", minLength: 2 },
          description: { type: "string", minLength: 5 },
          status: { type: "string", enum: PROJECT_STATUSES, default: "ACTIVE" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
        },
      },
      UpdateProjectRequest: {
        type: "object",
        description: "All fields are optional, but at least one field must be provided.",
        properties: {
          name: { type: "string", minLength: 2 },
          description: { type: "string", minLength: 5 },
          status: { type: "string", enum: PROJECT_STATUSES },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
        },
      },
      ProjectResponse: wrapped({ $ref: "#/components/schemas/Project" }),
      ProjectListResponse: paged("#/components/schemas/Project"),
      Task: {
        allOf: [
          baseEntity,
          {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              projectId: objectId,
              assignedTo: objectId,
              createdBy: objectId,
              status: { type: "string", enum: TASK_STATUSES },
              priority: { type: "string", enum: PRIORITIES },
              dueDate: { type: "string", format: "date" },
            },
          },
        ],
      },
      CreateTaskRequest: {
        type: "object",
        required: ["title", "description", "projectId"],
        properties: {
          title: { type: "string", minLength: 2 },
          description: { type: "string", minLength: 5 },
          projectId: objectId,
          assignedTo: objectId,
          status: { type: "string", enum: TASK_STATUSES, default: "TODO" },
          priority: { type: "string", enum: PRIORITIES, default: "MEDIUM" },
          dueDate: { type: "string", format: "date" },
        },
      },
      UpdateTaskRequest: {
        type: "object",
        description: "Partial task update. Any subset of create fields is accepted.",
        properties: {
          title: { type: "string", minLength: 2 },
          description: { type: "string", minLength: 5 },
          projectId: objectId,
          assignedTo: objectId,
          status: { type: "string", enum: TASK_STATUSES },
          priority: { type: "string", enum: PRIORITIES },
          dueDate: { type: "string", format: "date" },
        },
      },
      UpdateTaskStatusRequest: {
        type: "object",
        required: ["status"],
        properties: { status: { type: "string", enum: TASK_STATUSES } },
      },
      AssignRequest: {
        type: "object",
        required: ["assignedTo"],
        properties: { assignedTo: objectId },
      },
      TaskResponse: wrapped({ $ref: "#/components/schemas/Task" }),
      TaskListResponse: paged("#/components/schemas/Task"),
      Bug: {
        allOf: [
          baseEntity,
          {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              projectId: objectId,
              taskId: objectId,
              assignedTo: objectId,
              reportedBy: objectId,
              severity: { type: "string", enum: PRIORITIES },
              status: { type: "string", enum: BUG_STATUSES },
            },
          },
        ],
      },
      CreateBugRequest: {
        type: "object",
        required: ["title", "description", "projectId"],
        properties: {
          title: { type: "string", minLength: 2 },
          description: { type: "string", minLength: 5 },
          projectId: objectId,
          taskId: objectId,
          assignedTo: objectId,
          severity: { type: "string", enum: PRIORITIES, default: "MEDIUM" },
          status: { type: "string", enum: BUG_STATUSES, default: "OPEN" },
        },
      },
      UpdateBugRequest: {
        type: "object",
        description: "Partial bug update. Any subset of create fields is accepted.",
        properties: {
          title: { type: "string", minLength: 2 },
          description: { type: "string", minLength: 5 },
          projectId: objectId,
          taskId: objectId,
          assignedTo: objectId,
          severity: { type: "string", enum: PRIORITIES },
          status: { type: "string", enum: BUG_STATUSES },
        },
      },
      UpdateBugStatusRequest: {
        type: "object",
        required: ["status"],
        properties: { status: { type: "string", enum: BUG_STATUSES } },
      },
      UpdateBugSeverityRequest: {
        type: "object",
        required: ["severity"],
        properties: { severity: { type: "string", enum: PRIORITIES } },
      },
      BugResponse: wrapped({ $ref: "#/components/schemas/Bug" }),
      BugListResponse: paged("#/components/schemas/Bug"),
      Comment: {
        allOf: [
          baseEntity,
          {
            type: "object",
            properties: {
              content: { type: "string" },
              entityType: { type: "string", enum: ENTITY_TYPES },
              entityId: objectId,
              parentComment: objectId,
              mentions: { type: "array", items: { type: "string" } },
              attachments: { type: "array", items: { $ref: "#/components/schemas/FileAttachment" } },
              createdBy: objectId,
            },
          },
        ],
      },
      CreateCommentRequest: {
        type: "object",
        required: ["content", "entityId"],
        properties: {
          content: { type: "string", minLength: 1, maxLength: 5000 },
          entityType: { type: "string", enum: ENTITY_TYPES, default: "TASK" },
          entityId: objectId,
          parentComment: objectId,
          mentions: { type: "array", items: { type: "string" } },
          attachments: { type: "array", items: { type: "string", format: "binary" }, maxItems: 5 },
        },
      },
      UpdateCommentRequest: {
        type: "object",
        properties: {
          content: { type: "string", minLength: 1, maxLength: 5000 },
          mentions: { type: "array", items: { type: "string" } },
        },
      },
      CommentResponse: wrapped({ $ref: "#/components/schemas/Comment" }),
      CommentListResponse: paged("#/components/schemas/Comment"),
      FileAttachment: {
        type: "object",
        properties: {
          url: { type: "string", format: "uri" },
          key: { type: "string" },
          mimeType: { type: "string" },
          size: { type: "integer" },
          originalName: { type: "string" },
        },
      },
      Document: {
        allOf: [
          baseEntity,
          {
            type: "object",
            properties: {
              name: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              category: { type: "string", enum: DOCUMENT_CATEGORIES },
              entityType: { type: "string", enum: ENTITY_TYPES },
              entityId: objectId,
              projectId: objectId,
              taskId: objectId,
              bugId: objectId,
              orderId: objectId,
              uploadedBy: objectId,
              mimeType: { type: "string" },
              size: { type: "integer" },
              tags: { type: "array", items: { type: "string" } },
              url: { type: "string", format: "uri" },
            },
          },
        ],
      },
      UploadDocumentRequest: {
        type: "object",
        required: ["documents"],
        properties: {
          documents: { type: "array", items: { type: "string", format: "binary" }, maxItems: 10 },
          name: { type: "string", minLength: 2 },
          title: { type: "string", minLength: 2 },
          description: { type: "string" },
          category: { type: "string", enum: DOCUMENT_CATEGORIES, default: "OTHER" },
          entityType: { type: "string", enum: ENTITY_TYPES },
          entityId: objectId,
          projectId: objectId,
          taskId: objectId,
          bugId: objectId,
          orderId: objectId,
          tags: { type: "array", items: { type: "string" }, maxItems: 20 },
        },
        description:
          "Provide either entityType with entityId, or one of projectId, taskId, bugId, or orderId.",
      },
      UpdateDocumentRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2 },
          title: { type: "string", minLength: 2 },
          description: { type: "string" },
          category: { type: "string", enum: DOCUMENT_CATEGORIES },
          tags: { type: "array", items: { type: "string" }, maxItems: 20 },
        },
      },
      DocumentResponse: wrapped({ $ref: "#/components/schemas/Document" }),
      DocumentListResponse: paged("#/components/schemas/Document"),
      DocumentUploadResponse: wrapped({ type: "array", items: { $ref: "#/components/schemas/Document" } }),
      DocumentDownloadResponse: wrapped({
        type: "object",
        properties: {
          downloadUrl: { type: "string", format: "uri" },
          expiresIn: { type: "integer", example: 900 },
        },
      }),
      Notification: {
        allOf: [
          baseEntity,
          {
            type: "object",
            properties: {
              recipientId: objectId,
              actorUserId: objectId,
              type: { type: "string" },
              title: { type: "string" },
              message: { type: "string" },
              priority: { type: "string", enum: NOTIFICATION_PRIORITIES },
              channels: { type: "array", items: { type: "string", enum: NOTIFICATION_CHANNELS } },
              entityType: { type: "string" },
              entityId: { type: "string" },
              metadata: { type: "object", additionalProperties: true },
              readAt: dateTime,
              archivedAt: dateTime,
            },
          },
        ],
      },
      CreateNotificationRequest: {
        type: "object",
        required: ["recipientId", "type", "title", "message"],
        properties: {
          recipientId: { type: "string" },
          actorUserId: { type: "string" },
          type: { type: "string", maxLength: 120 },
          title: { type: "string", maxLength: 160 },
          message: { type: "string", maxLength: 1000 },
          priority: { type: "string", enum: NOTIFICATION_PRIORITIES },
          channels: { type: "array", items: { type: "string", enum: NOTIFICATION_CHANNELS } },
          entityType: { type: "string" },
          entityId: { type: "string" },
          metadata: { type: "object", additionalProperties: true },
        },
      },
      NotificationResponse: wrapped({ $ref: "#/components/schemas/Notification" }),
      NotificationListResponse: paged("#/components/schemas/Notification"),
      UnreadNotificationCountResponse: wrapped({
        type: "object",
        properties: { count: { type: "integer", example: 3 } },
      }),
      SearchResultItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: SEARCH_TYPES },
          title: { type: "string" },
          description: { type: "string" },
          status: { type: "string" },
          url: { type: "string" },
          metadata: { type: "object", additionalProperties: true },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      SearchResponse: wrapped({
        type: "object",
        properties: {
          query: { type: "string" },
          total: { type: "integer" },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
            },
          },
          counts: { type: "object", additionalProperties: { type: "integer" } },
          results: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { $ref: "#/components/schemas/SearchResultItem" },
            },
          },
        },
      }),
      ReportResponse: wrapped({
        type: "object",
        properties: {
          type: { type: "string", example: "projects" },
          format: { type: "string", enum: ["json", "csv", "excel", "pdf"] },
          fromDate: { type: "string", format: "date" },
          toDate: { type: "string", format: "date" },
          data: { type: "array", items: { type: "object", additionalProperties: true } },
          file: { $ref: "#/components/schemas/Document" },
        },
      }),
      AnalyticsEvent: {
        allOf: [
          baseEntity,
          {
            type: "object",
            properties: {
              userId: { type: "string" },
              eventName: { type: "string" },
              entityType: { type: "string" },
              entityId: { type: "string" },
              properties: { type: "object", additionalProperties: true },
              occurredAt: dateTime,
            },
          },
        ],
      },
      CreateAnalyticsEventRequest: {
        type: "object",
        required: ["eventName"],
        properties: {
          userId: { type: "string" },
          eventName: { type: "string", minLength: 1, maxLength: 120 },
          entityType: { type: "string", maxLength: 80 },
          entityId: { type: "string", maxLength: 120 },
          properties: { type: "object", additionalProperties: true },
          occurredAt: { type: "string", format: "date-time" },
        },
      },
      AnalyticsEventResponse: wrapped({ $ref: "#/components/schemas/AnalyticsEvent" }),
      AnalyticsEventListResponse: paged("#/components/schemas/AnalyticsEvent"),
      AnalyticsSummaryResponse: wrapped({
        type: "object",
        properties: {
          totalEvents: { type: "integer", example: 1200 },
          uniqueUsers: { type: "integer", example: 88 },
          byEventName: { type: "object", additionalProperties: { type: "integer" } },
        },
      }),
      AnalyticsTrendResponse: wrapped({
        type: "array",
        items: {
          type: "object",
          properties: {
            bucket: { type: "string", example: "2026-07-15" },
            count: { type: "integer", example: 42 },
          },
        },
      }),
      TopAnalyticsEventsResponse: wrapped({
        type: "array",
        items: {
          type: "object",
          properties: {
            eventName: { type: "string", example: "task.created" },
            count: { type: "integer", example: 21 },
          },
        },
      }),
    },
  },
  paths,
};

const postmanCollection = {
  info: {
    name: "Backend SaaS API",
    description: "Postman collection exported from the Backend SaaS OpenAPI documentation.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }],
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5001" },
    { key: "accessToken", value: "" },
    { key: "refreshToken", value: "" },
    { key: "id", value: "64f8a2e2c19f6b4f3a8f4d11" },
  ],
  item: swaggerSpec.tags.map((tag) => ({
    name: tag.name,
    item: Object.entries(paths)
      .flatMap(([path, methods]) =>
        Object.entries(methods)
          .filter(([, operation]) => operation.tags.includes(tag.name))
          .map(([method, operation]) => {
            const requestBody = operation.requestBody as
              | { content?: Record<string, { example?: unknown }> }
              | undefined;
            const jsonBody = requestBody?.content?.["application/json"];
            const formBody = requestBody?.content?.["multipart/form-data"];

            return {
              name: operation.summary,
              request: {
                method: method.toUpperCase(),
                header: jsonBody ? [{ key: "Content-Type", value: "application/json" }] : [],
                url: {
                  raw: `{{baseUrl}}${path.replace("{id}", "{{id}}")}`,
                  host: ["{{baseUrl}}"],
                  path: path
                    .replace(/^\//, "")
                    .split("/")
                    .map((part) => (part === "{id}" ? "{{id}}" : part)),
                },
                ...(jsonBody
                  ? {
                      body: {
                        mode: "raw",
                        raw: JSON.stringify(jsonBody.example || {}, null, 2),
                        options: { raw: { language: "json" } },
                      },
                    }
                  : {}),
                ...(formBody
                  ? {
                      body: {
                        mode: "formdata",
                        formdata: [{ key: "file", type: "file", src: [] }],
                      },
                    }
                  : {}),
                auth:
                  operation.security && operation.security.length > 0
                    ? undefined
                    : { type: "noauth" },
              },
              response: [],
            };
          }),
      ),
  })),
};

export { postmanCollection, swaggerSpec };
