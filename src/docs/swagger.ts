import swaggerJSDoc from "swagger-jsdoc";

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backend SaaS API",
      version: "1.0.0",
      description: "SaaS backend APIs for auth, tenants, users, orders, permissions, audit logs, and real-time notifications.",
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password", "tenantName", "role"],
          properties: {
            name: { type: "string", example: "Krishna" },
            email: { type: "string", example: "krishna@email.com" },
            password: { type: "string", example: "krishna123" },
            tenantName: { type: "string", example: "Ram Pvt Ltd" },
            role: { type: "string", enum: ["admin", "manager", "user"], example: "admin" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "admin@email.com" },
            password: { type: "string", example: "admin123" },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string", example: "paste-refresh-token-here" },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: { type: "string", example: "Audit Test User" },
            email: { type: "string", example: "audittest@email.com" },
            password: { type: "string", example: "test123" },
            role: { type: "string", enum: ["admin", "manager", "user"], example: "user" },
          },
        },
        UpdateUserRoleRequest: {
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", enum: ["admin", "manager", "user"], example: "manager" },
          },
        },
        CreateOrderRequest: {
          type: "object",
          required: ["productName", "amount"],
          properties: {
            productName: { type: "string", example: "Keyboard" },
            amount: { type: "number", example: 200 },
          },
        },
        UpdatePermissionsRequest: {
          type: "object",
          required: ["role", "permissions"],
          properties: {
            role: { type: "string", enum: ["admin", "manager", "user"], example: "manager" },
            permissions: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "create_order",
                  "view_own_orders",
                  "view_all_orders",
                  "delete_order",
                  "view_users",
                  "create_user",
                  "delete_user",
                  "manage_roles",
                  "view_audit_logs",
                ],
              },
              example: ["create_order", "view_own_orders", "view_all_orders", "view_users"],
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth" },
      { name: "Users" },
      { name: "Orders" },
      { name: "Permissions" },
      { name: "Audit Logs" },
      { name: "Realtime" },
    ],
    paths: {
      "/api/v1/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a tenant and user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            "201": { description: "User registered successfully" },
            "400": { description: "Validation or duplicate user error" },
          },
        },
      },
      "/api/v1/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login and receive JWT token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Login successful" },
            "400": { description: "Invalid email or password" },
          },
        },
      },
      "/api/v1/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Exchange refresh token for new access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Token refreshed successfully" },
            "401": { description: "Invalid or expired refresh token" },
          },
        },
      },
      "/api/v1/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout by revoking refresh session",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Logout successful" },
            "400": { description: "Session not found" },
          },
        },
      },
      "/api/v1/auth/sessions": {
        get: {
          tags: ["Auth"],
          summary: "List active sessions for logged-in user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Sessions fetched successfully" },
            "401": { description: "Invalid or missing access token" },
          },
        },
      },
      "/api/v1/auth/sessions/{id}": {
        delete: {
          tags: ["Auth"],
          summary: "Revoke one active session",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Session revoked successfully" },
            "404": { description: "Session not found" },
          },
        },
      },
      "/api/v1/users/profile": {
        get: {
          tags: ["Users"],
          summary: "Get logged-in user profile",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "User profile fetched successfully" },
            "401": { description: "Invalid or missing token" },
          },
        },
      },
      "/api/v1/users": {
        get: {
          tags: ["Users"],
          summary: "List tenant users with pagination, filtering, and search",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", example: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", example: 10 } },
            { name: "search", in: "query", schema: { type: "string", example: "krishna" } },
            { name: "role", in: "query", schema: { type: "string", enum: ["admin", "manager", "user"] } },
          ],
          responses: {
            "200": { description: "Users fetched successfully" },
            "403": { description: "Permission denied: view_users" },
          },
        },
        post: {
          tags: ["Users"],
          summary: "Create user in current tenant",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateUserRequest" },
              },
            },
          },
          responses: {
            "201": { description: "User created successfully" },
            "403": { description: "Permission denied: create_user" },
          },
        },
      },
      "/api/v1/users/{id}": {
        delete: {
          tags: ["Users"],
          summary: "Delete user from current tenant",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "User deleted successfully" },
            "403": { description: "Permission denied: delete_user" },
            "404": { description: "User not found" },
          },
        },
      },
      "/api/v1/users/{id}/role": {
        patch: {
          tags: ["Users"],
          summary: "Update user role",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateUserRoleRequest" },
              },
            },
          },
          responses: {
            "200": { description: "User role updated successfully" },
            "403": { description: "Permission denied: manage_roles" },
          },
        },
      },
      "/api/v1/orders": {
        get: {
          tags: ["Orders"],
          summary: "List orders with pagination, filtering, and search",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", example: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", example: 10 } },
            { name: "search", in: "query", schema: { type: "string", example: "keyboard" } },
            { name: "status", in: "query", schema: { type: "string", enum: ["pending", "processing", "completed", "failed", "cancelled"] } },
            { name: "paymentStatus", in: "query", schema: { type: "string", enum: ["pending", "paid", "failed"] } },
          ],
          responses: {
            "200": { description: "Orders fetched successfully" },
          },
        },
        post: {
          tags: ["Orders"],
          summary: "Create order",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateOrderRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Order created successfully" },
            "403": { description: "Permission denied: create_order" },
          },
        },
      },
      "/api/v1/orders/{id}": {
        get: {
          tags: ["Orders"],
          summary: "Get order by id",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Order fetched successfully" },
            "404": { description: "Order not found" },
          },
        },
        delete: {
          tags: ["Orders"],
          summary: "Delete order",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Order deleted successfully" },
            "403": { description: "Permission denied: delete_order" },
            "404": { description: "Order not found" },
          },
        },
      },
      "/api/v1/permissions": {
        get: {
          tags: ["Permissions"],
          summary: "Get role permissions",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Permissions fetched successfully" },
            "403": { description: "Permission denied: manage_roles" },
          },
        },
        patch: {
          tags: ["Permissions"],
          summary: "Update role permissions",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdatePermissionsRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Permissions updated successfully" },
            "403": { description: "Permission denied: manage_roles" },
          },
        },
      },
      "/api/v1/audit-logs": {
        get: {
          tags: ["Audit Logs"],
          summary: "List tenant audit logs",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", example: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", example: 10 } },
            { name: "search", in: "query", schema: { type: "string", example: "user.created" } },
            { name: "action", in: "query", schema: { type: "string", enum: ["user.created", "user.role_changed", "order.deleted", "permission.updated"] } },
            { name: "targetType", in: "query", schema: { type: "string", enum: ["user", "order", "permission"] } },
          ],
          responses: {
            "200": { description: "Audit logs fetched successfully" },
            "403": { description: "Permission denied: view_audit_logs" },
          },
        },
      },
      "/socket.io": {
        get: {
          tags: ["Realtime"],
          summary: "Socket.IO endpoint",
          description: "Connect with socket.io-client using auth token: io('http://localhost:5001', { auth: { token } }) and listen for the notification event.",
          responses: {
            "101": { description: "WebSocket upgrade" },
          },
        },
      },
    },
  },
  apis: [],
});

export { swaggerSpec };
