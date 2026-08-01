# Frontend Design and User Flow

## 1. Purpose

This document defines a frontend experience that directly complements the Backend SaaS API. It translates the backend's tenant isolation, roles, permissions, modules, status models, uploads, reports, background jobs, and real-time notifications into a practical web application.

The recommended product is a responsive desktop-first workspace for software product teams. Its experience should feel like a focused combination of Jira, Asana, and an internal operations portal, while remaining limited to features the current API actually supports.

The frontend should help every user answer three questions quickly:

1. What needs my attention?
2. What work can I view or change?
3. What has changed since my last visit?

## 2. Product Design Principles

- **Permission-driven:** Navigation, buttons, menus, routes, and form controls must be derived from backend permissions. Hiding a control improves usability but does not replace backend authorization.
- **Tenant-safe:** The frontend must never accept or switch arbitrary tenant IDs. Tenant identity comes from the authenticated session.
- **Work-centered:** Projects, tasks, bugs, comments, documents, and activities should be connected rather than presented as isolated tools.
- **Role-relevant:** Each role should land on information useful for its daily work.
- **Status-visible:** Status, priority, severity, assignee, due date, and ownership should be visible without opening every record.
- **Responsive to backend events:** Mutations should update cached data, and Socket.IO notifications should refresh affected views.
- **Honest about asynchronous work:** Order and email processing states must be shown as pending, processing, completed, sent, or failed instead of implying instant completion.
- **Accessible:** All actions must work by keyboard, have visible focus states, use sufficient contrast, and not communicate status by color alone.

## 3. Recommended Frontend Stack

The backend is frontend-framework independent. A suitable implementation stack would be:

| Concern | Recommendation |
| --- | --- |
| Framework | Next.js with React and TypeScript, or React with Vite if server rendering is unnecessary |
| Routing | Next.js App Router or React Router |
| Server state | TanStack Query for caching, pagination, invalidation, and mutation states |
| Local UI state | React state or Zustand for small cross-page concerns only |
| Forms | React Hook Form with Zod schemas aligned to API validation |
| API client | A centralized typed `fetch` or Axios client |
| Styling | Tailwind CSS plus a reusable component library, or another token-based design system |
| Tables | TanStack Table or an accessible equivalent |
| Charts | Recharts, Chart.js, or another accessible chart library |
| Realtime | Socket.IO client |
| Dates | date-fns or Day.js, with server dates treated as ISO/UTC values |
| Testing | Vitest/Jest, Testing Library, Mock Service Worker, and Playwright |

The OpenAPI file at `docs/openapi.json` can be used to generate TypeScript API types. Generated types should be treated as the contract, while UI validation schemas can add user-friendly messages.

## 4. Application Shell

### 4.1 Desktop Layout

```text
+-----------------------------------------------------------------------+
| Logo / Workspace | Global search        | + Create | Bell | User menu |
+------------------+----------------------------------------------------+
|                  | Breadcrumbs                                       |
| Dashboard        +----------------------------------------------------+
| My Work          | Page title                     Filters / Actions   |
| Projects         +----------------------------------------------------+
| Tasks            |                                                    |
| Bugs             |                Page content                        |
| Documents        |                                                    |
| Orders           |                                                    |
| Reports          |                                                    |
| Activity         |                                                    |
| Analytics        |                                                    |
| Emails           |                                                    |
| Administration   |                                                    |
+------------------+----------------------------------------------------+
```

### 4.2 Mobile Layout

- Replace the fixed sidebar with a menu drawer.
- Keep the page title and one primary action in the top bar.
- Place search in a full-screen command view.
- Show dense tables as cards or allow horizontal scrolling with frozen identifying columns.
- Use bottom sheets for filters and simple edit actions.
- Do not hide important status, assignee, priority, or due-date information on smaller screens.

### 4.3 Global Header

The header should contain:

- Tenant or workspace name.
- Global search trigger.
- Contextual **Create** menu containing only actions the current user has permission to perform.
- Notification bell with unread count.
- Current user's avatar, name, and role.
- User menu for profile, active sessions, and logout.

There is currently no tenant-switching API. Do not display a workspace switcher unless multi-tenant membership is added later.

## 5. Navigation Structure

### Primary Navigation

| Navigation item | Destination | Required permission or availability |
| --- | --- | --- |
| Dashboard | `/dashboard` | `view_dashboard` |
| My Work | `/my-work` | Built from permitted task and bug queries |
| Projects | `/projects` | `view_project` |
| Tasks | `/tasks` | `view_task` |
| Bugs | `/bugs` | `view_bug` |
| Documents | `/documents` | `view_document` |
| Orders | `/orders` | `view_orders`; omit when unavailable |
| Reports | `/reports` | `view_reports` |
| Activity | `/activity` | `view_activity` |
| Analytics | `/analytics` | `view_analytics` |
| Emails | `/emails` | `view_email` |
| Team | `/admin/users` | `manage_users` |
| Roles and Permissions | `/admin/permissions` | `manage_roles` |
| Audit Logs | `/admin/audit` | `view_audit_logs` |

Notifications and profile are accessed from the global header rather than consuming permanent sidebar space.

### Role-Based Default Landing Pages

| Role | Default landing experience |
| --- | --- |
| Super Admin | Organization dashboard with totals, operational health, recent activity, and quick administration links |
| Head Product Manager | Delivery dashboard with active projects, task progress, open bugs, workload, and reports |
| Team Lead | Team execution view with assigned work, blocked tasks, high-severity bugs, and workload |
| Developer | My Work view filtered to assigned tasks and bugs, due dates, comments, and notifications |
| Tester | Testing view emphasizing tasks ready for review and open/fixed bugs requiring verification |

The API has one dashboard response for all permitted users. Role-specific sections can be assembled from dashboard totals plus filtered task, bug, project, notification, and activity calls.

## 6. Authentication and Onboarding Flow

### 6.1 Public Routes

- `/login`
- `/register`
- A lightweight error/offline page

Password reset is not supported by the current backend and should not be presented as functional until corresponding endpoints exist.

### 6.2 Registration

```text
Register form
    -> validate tenant/company and first-user information
    -> POST /api/v1/auth/register
    -> store authenticated session according to backend response
    -> load profile and permissions
    -> open first-time setup checklist
```

The first registered user becomes `super_admin`. The first-time checklist should suggest:

1. Upload a profile image.
2. Add team members.
3. Assign appropriate roles.
4. Create the first project.
5. Create and assign the first task.

### 6.3 Login

```text
Login form
    -> POST /api/v1/auth/login
    -> initialize access and refresh session
    -> GET /api/v1/users/profile
    -> derive allowed UI capabilities from the authenticated role
    -> connect Socket.IO with access token
    -> redirect to role-relevant landing page
```

The client should show specific field errors, a general invalid-credentials message, and a locked-account message when returned by the API. Avoid revealing whether an email address exists.

### 6.4 Token Refresh

- Add the access token to protected requests.
- When an access token expires, allow one refresh request to run while other failed requests wait.
- Call `POST /api/v1/auth/refresh`, update the session, and retry queued requests once.
- If refresh fails, clear private cache, disconnect Socket.IO, and redirect to login.
- Do not create an infinite refresh loop.
- Prefer secure, HTTP-only cookie storage if the backend deployment supports it. If tokens are returned to JavaScript, avoid persistent local storage where possible and document the security trade-off.

### 6.5 Logout and Sessions

- Logout calls `POST /api/v1/auth/logout`, disconnects the socket, clears private state, and returns to login.
- The profile area should include an **Active Sessions** page using `GET /auth/sessions`.
- Each other session should have a revoke action using `DELETE /auth/sessions/:id`.
- Clearly mark the current session when that information is available.

## 7. Permissions in the Frontend

The login response and profile expose the user's role. Keep a frontend permission map generated or copied from `src/common/permissions/role-permissions.ts`, and normalize the permissions for that role into a `Set<string>`. Only users with `manage_roles` can call `GET /api/v1/permissions`, so that endpoint cannot be the permission bootstrap mechanism for developers, testers, team leads, or product managers.

The backend remains the security authority. The frontend map controls presentation only and must be kept synchronized with the backend mapping. A future backend improvement could expose a safe `GET /me/permissions` endpoint to every authenticated user and eliminate this duplication.

Use one shared helper:

```ts
can("create_task")
can("assign_task")
can("delete_document")
```

Apply it consistently to:

- Route guards.
- Sidebar items.
- Quick-create actions.
- Buttons and overflow menus.
- Editable versus read-only fields.
- Search resource categories.
- Empty-state calls to action.

If a user manually opens a forbidden route, show a clear **You do not have access** page. If the backend returns `403` after a role change, refresh profile and permissions, invalidate protected data, and send the user to the nearest permitted page.

## 8. Core Screen Designs

### 8.1 Dashboard

Backend source: `GET /api/v1/dashboard`

Recommended layout:

- Summary cards for total projects, tasks, bugs, orders, and users where relevant.
- Task progress section showing pending versus completed work.
- Bug quality section showing open versus resolved defects.
- Order section showing pending versus completed processing.
- Recent activity feed from `/activities`.
- My open work panel using task and bug filters.
- Quick-create actions controlled by permissions.

Every dashboard card should link to its filtered list. If the user cannot access a resource, omit its card instead of showing an unusable number.

### 8.2 My Work

This is a frontend-composed page rather than a dedicated backend endpoint.

- Query tasks with `assignedTo=<currentUserId>`.
- Query bugs with `assignedTo=<currentUserId>`.
- Display overdue and upcoming work.
- Group by status, priority, project, or due date.
- Allow inline status changes only with the appropriate update permission.

For testers, add a **Needs Verification** view using bug status `FIXED`. For developers, emphasize `TODO`, `IN_PROGRESS`, `BLOCKED`, and assigned bugs.

### 8.3 Projects

#### Project List

- Search field and status filter: `ACTIVE`, `COMPLETED`, `ON_HOLD`.
- Table or card view with name, status, dates, creator, and updated time when returned.
- Primary action: **New Project** for users with `create_project`.
- Server-side pagination and URL-synchronized filters.

#### Project Detail

Recommended tabs:

- **Overview:** name, description, status, start date, and end date.
- **Tasks:** `/tasks?projectId=:id`.
- **Bugs:** `/bugs?projectId=:id`.
- **Documents:** `/documents` filtered to the project entity.
- **Comments:** `/comments?entityType=PROJECT&entityId=:id`.
- **Activity:** `/activities/entity/PROJECT/:id`.

Edit and delete actions must be permission-controlled. Before deletion, use a confirmation dialog that names the project and explains that the action may affect related workflows.

### 8.4 Tasks

#### Task List and Board

Filters supported by the backend:

- Search.
- Status.
- Priority.
- Project.
- Assignee.

Support both a table and a Kanban-style visualization. The columns map exactly to:

```text
TODO -> IN_PROGRESS -> IN_REVIEW -> DONE
                    \-> BLOCKED
```

Dragging a task must call `PATCH /tasks/:id/status`; it must not only update local state. Use an optimistic update with rollback and an error toast if the server rejects the change.

#### Task Detail

- Title, description, project, status, priority, assignee, creator, due date, and timestamps.
- Status control using `PATCH /tasks/:id/status`.
- Assignee control using `PATCH /tasks/:id/assign`.
- General edit using `PUT /tasks/:id`.
- Tabs or sections for comments, documents, linked bugs, and activity.
- Delete in the overflow menu for users with `delete_task`.

### 8.5 Bugs

#### Bug List

Filters supported by the backend:

- Search.
- Status.
- Severity.
- Project.
- Task.
- Assignee.
- Reporter.

Bug states must map exactly to:

```text
OPEN -> IN_PROGRESS -> FIXED -> VERIFIED -> CLOSED
```

The UI may warn about unusual transitions but should not invent strict transition rules that the backend does not enforce.

#### Bug Detail

- Display title, description, project, linked task, reporter, assignee, severity, status, and timestamps.
- Provide focused actions for assignment, status, and severity only when the related backend operation and permission are available.
- Show comments, evidence documents, and activity below the core record.
- Testers should receive a prominent **Verify Fix** action when status is `FIXED`.
- Critical and high-severity bugs need text labels and icons in addition to color.

Note: the current persisted bug model exposes severity but does not persist a separate priority field. Although `API.md` mentions a bug-priority endpoint, the implemented bug router does not currently expose it. Do not display or edit bug priority until the backend model and route support it.

### 8.6 Comments

Comments are contextual and should normally appear inside project, task, bug, or order detail views rather than as a primary navigation page.

- Use `entityType` and `entityId` to load the correct thread.
- Support replies using `parentComment`.
- Support user mentions using tenant user IDs.
- Allow edit and delete only when permitted; backend ownership rules remain authoritative.
- Display edit state, author identity, profile image, and timestamp when returned.
- Upload document evidence through the document flow rather than assuming comment attachment fields have a dedicated upload endpoint.

### 8.7 Documents

#### Document Library

- Search/list view with entity type, category, uploader, size, tags, and date filters supported by the response/query contract.
- Filters for project, task, bug, order, or comment association.
- File-type icon and human-readable size.
- Upload action for `upload_document`.

#### Upload Flow

```text
Choose target entity
    -> choose category and optional metadata/tags
    -> select up to 10 valid files
    -> validate extension, MIME type, and size client-side
    -> multipart POST /api/v1/documents using field "documents"
    -> show per-request progress/state
    -> refresh entity documents and activity
```

The upload must target exactly one entity. Downloads should request `/documents/:id/download-url` and then open the returned temporary URL. Do not treat stored S3 URLs as permanently public.

### 8.8 Orders

#### Order List

- Search by product or order number.
- Filter by order status and payment status.
- Display product name, order number, amount, payment status, processing status, owner, and created date.
- Developers and testers should see only the orders returned for them; the UI must not imply tenant-wide access.

Order status labels:

- `pending`
- `processing`
- `completed`
- `failed`
- `cancelled`

Payment status labels:

- `pending`
- `paid`
- `failed`

#### Create and Detail Flow

1. Submit product name and positive amount to `POST /orders`.
2. Show the created order immediately with pending/processing state.
3. Poll the order detail with a backoff while processing, or refresh it when a matching Socket.IO notification arrives.
4. Allow a single PDF invoice upload through `/orders/:id/invoice`.
5. Allow supported attachments through `/orders/:id/attachments`.
6. Show failure clearly and provide guidance; do not expose a retry button unless an order retry endpoint is added.

### 8.9 Notifications

- Bell badge reads `/notifications/unread-count`.
- Dropdown shows the newest unread notifications.
- **View all** opens `/notifications` with all/read/unread and archived filters.
- Opening a notification can call `PATCH /notifications/:id/read` and route to its entity when `entityType` and `entityId` are available.
- Provide mark-all-read, archive, and delete actions based on permissions.
- Deduplicate socket events and fetched records by notification ID where possible.

### 8.10 Search

Use a global command palette opened from the header or with `/` or `Ctrl/Cmd + K`.

- Delay requests briefly while typing.
- Call `/search?q=...&types=...`.
- Group results into projects, tasks, bugs, documents, comments, activities, notifications, analytics, emails, orders, and users.
- Only request and display resource types the user can access.
- Use the result URL when supplied; otherwise map type and ID to the appropriate detail route.
- Include a full results page with pagination for larger result sets.

### 8.11 Reports

Provide report cards for:

- Projects.
- Tasks.
- Bugs.
- Team workload.
- Orders.
- Audit activity.

Each report screen should provide date range, output format (`json`, `csv`, `excel`, or `pdf`), and the supported upload option. JSON results can render as charts and tables. Export responses should trigger a download or use the returned signed URL. Disable report types the user cannot access.

### 8.12 Analytics

- Summary cards from `/analytics/summary`.
- Trend chart from `/analytics/trend` with hour, day, or month interval.
- Top-events visualization from `/analytics/top-events`.
- Event table from `/analytics/events` with user, name, entity, and date filters.
- Event creation should generally happen as product instrumentation rather than as a prominent manual user form.

### 8.13 Activity Feed

- Timeline grouped by date.
- Actor avatar and identity, action, summary, target, and time.
- Filters for actor, action, entity, project, visibility, dates, and search.
- Entity-specific timelines should appear in detail pages.
- Render change sets as human-readable before/after values, not raw JSON by default.

### 8.14 Email Operations

- Summary cards for delivery states.
- Email log table with status, recipient information, subject, requester, and timestamps as returned by the API.
- Compose/create view for users with `create_email`.
- Failed items show a retry action using `PATCH /emails/:id/retry` for users with update permission.
- Clearly distinguish queued, sent, and failed states.

### 8.15 Team Administration

#### Users

- Search and role filter.
- User table with avatar, name, email, role, and created date.
- Create-user dialog matching the backend's password requirements:
  - At least 12 characters.
  - Lowercase and uppercase letters.
  - A number.
  - A special character.
- Change-role dialog using `PATCH /users/:id/role`.
- Remove-user confirmation using `DELETE /users/:id`.
- Prevent or gracefully handle self-role changes according to backend rules.

#### Roles and Permissions

- Display all five roles and a categorized permission matrix.
- Use `GET /permissions` as the source of truth.
- Treat the current matrix as read-only in the production UI.
- The existing `PATCH /permissions` operation validates and returns a proposed permission set but does not persist changes to a database or change runtime authorization. It may be exposed only as a clearly labelled development preview.
- Enable real permission editing only after the backend stores tenant-specific mappings and `hasPermission` reads them during authorization.

#### Audit Logs

- Read-only table for super admins or any role with `view_audit_logs`.
- Filters for action, target type, and search.
- Expand a row to show actor, target, timestamp, and structured details.
- Audit entries must never show edit or delete actions.

### 8.16 Profile

- Show name, email, role, profile image, and tenant/workspace identity where available.
- Upload profile image using `POST /users/profile/image`.
- Provide active-session management.
- Do not show unsupported profile-edit or password-change controls until APIs exist.

## 9. Shared Detail-Page Pattern

Projects, tasks, bugs, orders, and documents should follow one predictable structure:

```text
Breadcrumbs
Entity title + status badge                         Primary action
Metadata row: owner / assignee / dates / priority
-----------------------------------------------------------------
Main description or content              Context summary panel
-----------------------------------------------------------------
Tabs: Related work | Comments | Documents | Activity
```

This consistency reduces learning time and makes cross-module navigation feel like one product.

## 10. Status and Visual Language

Recommended semantic mappings:

| Meaning | Treatment |
| --- | --- |
| New or pending | Neutral/slate badge |
| Active or in progress | Blue badge |
| In review or fixed | Purple badge |
| Completed, verified, paid, or sent | Green badge |
| Blocked, failed, or critical | Red badge |
| On hold or medium warning | Amber badge |
| Closed, cancelled, or archived | Gray badge |

Every badge must include readable text. Colors should be implemented as design tokens so dark mode and accessibility can be supported consistently.

## 11. API Integration Architecture

### 11.1 Client Layers

```text
Page / feature component
        -> query or mutation hook
        -> typed API service
        -> authenticated HTTP client
        -> Backend SaaS API
```

Recommended service boundaries:

- `authApi`
- `usersApi`
- `permissionsApi`
- `projectsApi`
- `tasksApi`
- `bugsApi`
- `commentsApi`
- `documentsApi`
- `ordersApi`
- `notificationsApi`
- `activitiesApi`
- `analyticsApi`
- `emailsApi`
- `reportsApi`
- `searchApi`
- `dashboardApi`
- `auditApi`

### 11.2 Response Handling

The backend generally returns:

```json
{
  "message": "Human readable status",
  "data": {}
}
```

Create one response-unwrapping function and one normalized API error type. Paginated screens should preserve the backend pagination object and should not fetch all records for client-side filtering.

### 11.3 Query Keys and Invalidation

Example query keys:

```text
["profile"]
["permissions"]
["dashboard"]
["projects", filters]
["project", projectId]
["tasks", filters]
["task", taskId]
["bugs", filters]
["notifications", filters]
["notification-unread-count"]
```

After a mutation, invalidate the detail record, related list, dashboard, activity, and relevant reports. Avoid clearing the entire cache for every small change.

### 11.4 URL State

Persist list state in query parameters:

```text
/tasks?page=2&status=IN_PROGRESS&priority=HIGH&projectId=...
```

This makes filtered views bookmarkable, shareable, and compatible with browser navigation.

## 12. Real-Time Data Flow

```text
Authenticated app
    -> connect Socket.IO with access token
    -> server joins tenant and user rooms
    -> listen for "notification"
    -> show toast when appropriate
    -> update unread count
    -> invalidate affected entity queries
```

Rules:

- Connect only after authentication succeeds.
- Disconnect on logout or terminal authentication failure.
- Reconnect with a fresh access token after refresh when needed.
- Do not rely on Socket.IO as the only data source; refetch canonical API state.
- Avoid showing a toast for an event caused by the current user's action if the mutation already provided confirmation.
- Route entity notifications through one central entity-to-URL mapping.

## 13. Loading, Empty, Error, and Mutation States

Every page must define all four states:

- **Loading:** skeletons matching the final layout; avoid blocking the whole shell.
- **Empty:** explain why no data exists and show a permitted next action.
- **Filtered empty:** state that no results match and offer to clear filters.
- **Error:** show a useful message and retry action while preserving entered filters.

Mutation behavior:

- Disable duplicate submission while a request is active.
- Show progress for uploads.
- Use optimistic updates only for reversible, low-risk actions such as marking a notification read or changing a board status.
- Use confirmed server data for destructive operations and complex records.
- Keep modal input when the server rejects a request so the user can correct it.

## 14. Suggested Frontend Route Map

```text
/
|-- /login
|-- /register
|-- /dashboard
|-- /my-work
|-- /projects
|   |-- /new
|   `-- /:projectId
|-- /tasks
|   |-- /new
|   `-- /:taskId
|-- /bugs
|   |-- /new
|   `-- /:bugId
|-- /documents
|   `-- /:documentId
|-- /orders
|   |-- /new
|   `-- /:orderId
|-- /notifications
|-- /search
|-- /reports
|   |-- /projects
|   |-- /tasks
|   |-- /bugs
|   |-- /team-workload
|   |-- /orders
|   `-- /audit
|-- /activity
|-- /analytics
|-- /emails
|   `-- /:emailId
|-- /profile
|   `-- /sessions
`-- /admin
    |-- /users
    |-- /permissions
    `-- /audit
```

Routes should exist only when they have a meaningful screen. Comments remain contextual rather than receiving a standalone route.

## 15. Primary End-to-End Frontend Flow

```text
Company registers
    -> Super admin enters workspace
    -> Adds users and assigns roles
    -> Product manager creates project
    -> Manager/lead creates and assigns tasks
    -> Developer updates task progress
    -> Tester creates a linked bug
    -> Developer fixes bug and comments
    -> Tester verifies bug
    -> Documents provide evidence and specifications
    -> Socket notifications update participants
    -> Dashboard, activity, analytics, and reports reflect progress
    -> Audit log records sensitive administrative actions
```

This should be the central workflow used for UX testing because it exercises the backend as one connected system rather than a collection of CRUD pages.

## 16. What the Frontend Should Not Assume

The current backend does not provide confirmed support for the following, so the frontend should not present them as working features:

- Multiple tenant memberships or tenant switching.
- Custom project members or per-project access rules.
- Sprints, epics, milestones, or time tracking.
- A full real-time chat system.
- Billing and subscription management.
- Payment-provider checkout.
- Password reset or password change.
- General profile text editing.
- Order retry or manual status-update controls.
- Collaborative document editing or version history.
- Hard-coded workflow transition restrictions beyond API validation.

These can be planned as later phases only after backend contracts are added.

## 17. Delivery Plan

### Phase 1: Foundation

- Design tokens and shared components.
- Public authentication screens.
- Token refresh and route protection.
- Profile and permission bootstrap.
- Responsive application shell.
- Standard API client, errors, pagination, and forms.

### Phase 2: Core Product Delivery

- Dashboard and My Work.
- Projects.
- Tasks with table and board views.
- Bugs.
- Contextual comments and activities.

### Phase 3: Collaboration

- Documents and secure downloads.
- Notifications and Socket.IO integration.
- Global search.
- Profile image and session management.

### Phase 4: Management and Operations

- Reports and exports.
- Analytics.
- Orders, invoices, and attachments.
- Email operations.
- Team, permission, and audit administration.

### Phase 5: Quality and Release

- Accessibility audit.
- Cross-role end-to-end tests.
- Responsive browser testing.
- Upload and large-list testing.
- Token-expiry and reconnect testing.
- Performance monitoring and production error reporting.

## 18. Minimum Acceptance Scenarios

Before release, verify at least these scenarios:

1. Registration creates a workspace and signs in the first super admin.
2. Login, refresh, logout, and session revocation behave correctly.
3. Each role sees only permitted navigation and actions.
4. Backend `403` responses remain safely handled even if a hidden action is requested manually.
5. Project, task, and bug workflows update all related lists and details.
6. Developer and tester My Work views are correctly filtered.
7. Comment threads and mentions use the correct entity IDs.
8. Document uploads enforce limits and downloads use temporary signed URLs.
9. Order processing state changes are visible without implying synchronous completion.
10. Socket events update notification counts and relevant records without duplicates.
11. Reports export in every supported format.
12. Tenant data never leaks into URLs, caches, search results, or stale sessions.
13. Keyboard navigation, screen-reader labels, focus management, and contrast meet accessibility expectations.

## 19. Final Recommendation

The frontend should be built as a unified product-delivery workspace, not as separate admin panels for every API module. Projects are the main context; tasks and bugs represent delivery; comments, documents, activity, and notifications support collaboration; dashboards, analytics, search, and reports provide visibility; and administration secures the tenant.

Following this design gives every backend module a clear user-facing purpose while keeping the interface aligned with actual permissions and API capabilities.
