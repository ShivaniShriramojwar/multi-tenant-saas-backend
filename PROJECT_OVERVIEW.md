# Backend SaaS Project Overview

## 1. Executive Summary

This project is a production-oriented, multi-tenant backend for managing a company's product-development and operational work from one platform. It provides APIs for organizations, users, projects, tasks, bugs, comments, documents, notifications, reports, analytics, emails, and orders.

The system is designed for software teams whose members have different responsibilities. Administrators manage the company and its users, product managers organize delivery, team leads coordinate work, developers implement features, and testers verify the results and report defects.

Each registered company is treated as a separate **tenant**. Its users and business data are isolated from other companies using tenant-aware authentication, database queries, file paths, notifications, reports, and searches.

## 2. Goal Behind the Project

The main goal is to provide one secure backend that a web or mobile application can use to coordinate the complete lifecycle of product delivery.

The project addresses several common problems:

- Work information is often spread across project boards, bug trackers, documents, emails, and reporting tools.
- Team members need different levels of access based on their responsibilities.
- Companies using the same SaaS platform must not be able to access one another's information.
- Users need immediate updates when important events occur.
- Time-consuming work such as email delivery and order processing should happen in the background without delaying API requests.
- Managers need dashboards and reports to understand progress, workload, quality, and operations.

The result is a reusable backend foundation for building a collaborative project and product-operations SaaS application.

## 3. What Kind of Application Is It?

The application is best described as a combination of:

- **Project and task management** for planning and tracking work.
- **Issue and bug tracking** for quality assurance and software delivery.
- **Team collaboration** through comments, activities, notifications, documents, and email.
- **Management reporting** through dashboards, analytics, search, and reports.
- **Basic operational order processing** with invoices, attachments, and background jobs.
- **SaaS administration** through tenants, users, roles, permissions, sessions, and audit logs.

It is a backend API rather than a complete end-user product. A frontend web application, mobile application, or another API client would consume these services.

## 4. Real-World Products It Is Similar To

Conceptually, the project is similar to a lightweight combination of the following products:

| Product | Similar area in this project |
| --- | --- |
| Jira | Projects, tasks, bug tracking, assignments, priorities, statuses, and team workflows |
| Asana, ClickUp, or Monday.com | Work planning, task coordination, dashboards, activities, and team workload reporting |
| Linear | Developer-focused issue and bug workflow with comments and assignments |
| Notion or Confluence | Shared document metadata, attachments, and information linked to work items |
| Slack or Microsoft Teams | Real-time user and tenant notifications, although this project is not a full chat system |
| Shopify or an internal operations portal | A limited order workflow with processing, invoices, attachments, and status tracking |

These are functional comparisons only. The current project does not claim complete feature parity with any of these products. Its distinct value is placing these capabilities behind one tenant-aware API and one role-based security model.

## 5. User Roles

The system has five roles. Access is controlled by centralized role-based permissions.

### 5.1 Super Admin (`super_admin`)

The highest-level role within a tenant. This role is intended for the company owner or system administrator.

Main responsibilities:

- Manage company settings, users, and roles.
- Access all project, task, bug, comment, document, notification, email, order, analytics, and reporting capabilities.
- View audit logs.
- Create, update, assign, and delete records where supported.
- Monitor the complete tenant workspace.

### 5.2 Head Product Manager (`head_product_manager`)

Responsible for product direction and delivery planning.

Main responsibilities:

- Create, view, and update projects.
- Create, assign, view, and update tasks.
- Create, view, and update bugs.
- Use dashboards, analytics, and reports.
- Create and manage operational emails.
- Collaborate through comments, notifications, activities, and documents.
- View orders.

This role cannot manage tenant users or roles, view audit logs, or perform every destructive administrator operation.

### 5.3 Team Lead (`team_lead`)

Responsible for coordinating developers and testers during delivery.

Main responsibilities:

- View projects.
- Create, assign, view, and update tasks.
- Create, view, and update bugs.
- View dashboards, analytics, reports, activities, and email records.
- Collaborate through comments and notifications.
- Upload, view, and update documents.

### 5.4 Developer (`developer`)

Responsible for implementing the work assigned to the engineering team.

Main responsibilities:

- View projects and tasks.
- Update tasks and bugs while work progresses.
- View and contribute to comments.
- Upload, view, and update related documents.
- View dashboards, activities, analytics, emails, and notifications.
- Access only their own orders where the order service applies restricted access.

### 5.5 Tester (`tester`)

Responsible for verifying features and recording quality problems.

Main responsibilities:

- View projects and tasks.
- Create, view, and update bugs.
- Add and update comments.
- Upload, view, and update supporting documents.
- View dashboards, activities, analytics, emails, and notifications.
- Access only their own orders where the order service applies restricted access.

## 6. Application Modules

| Module | Purpose and main capabilities |
| --- | --- |
| Authentication | Register a company and its first user, log in, refresh authentication, log out, list sessions, and revoke sessions |
| Tenant | Represent each customer organization and provide the boundary for data isolation |
| User | Manage profiles, profile images, tenant members, user creation, role changes, and user removal |
| Permission | Expose role-permission information and support authorized role-management flows |
| Project | Create, list, view, update, and delete tenant projects according to permission rules |
| Task | Manage work items, assignees, statuses, and priorities within the tenant |
| Bug | Track defects, assignees, severity, priority, and resolution status |
| Comment | Add discussions to projects, tasks, bugs, orders, and other comments |
| Document | Upload and organize documents, link them to business entities, and provide secure signed downloads from S3 |
| Order | Create and track orders, upload invoices and attachments, and process orders asynchronously |
| Notification | Create in-app notifications, track unread items, mark as read, archive or delete them, and deliver real-time events |
| Email | Create email logs, queue email delivery, view delivery summaries, and retry failed delivery |
| Activity | Maintain a tenant activity feed showing important work performed in the application |
| Analytics | Record custom analytics events and return tenant-level analytical information |
| Dashboard | Return aggregated counts and operational summaries for the tenant |
| Search | Search across supported tenant resources while respecting the user's permissions |
| Report | Produce reports for projects, tasks, bugs, team workload, orders, and audit activity |
| Audit | Record and expose important security and business changes for authorized administrators |

## 7. Important Platform Capabilities

### Multi-Tenant Data Isolation

One deployment can serve multiple companies. JWTs contain the authenticated user's tenant identifier, and tenant filters are applied to data access. Files and real-time notification rooms are also organized by tenant.

### Role-Based Access Control

Permissions are assigned to roles rather than duplicated throughout the code. Routes perform permission checks, while services also validate tenant membership and ownership of individual objects.

### Secure Authentication and Sessions

The API uses password hashing, JWT access tokens, refresh sessions, session revocation, rate limiting, request validation, CORS controls, and other HTTP security middleware.

### Real-Time Updates

Socket.IO sends events to tenant-wide or user-specific rooms. A frontend can use these events to update notification badges and activity without repeated page refreshes.

### Background Processing

Redis and BullMQ handle order processing and email delivery outside the main HTTP request. Jobs can be retried, and their state can be tracked without keeping the user waiting.

### Secure File Storage

Documents, invoices, and attachments are stored in AWS S3. File validation limits unsafe uploads, tenant-prefixed keys separate customer files, and signed URLs provide time-limited downloads.

### API Documentation and Operations

The project includes Swagger/OpenAPI documentation, a Postman collection, structured logging, health and readiness endpoints, Docker configuration, tests, deployment documentation, and an operations runbook.

## 8. How the Application Is Useful to Users

### For Company Owners and Administrators

- Create a dedicated workspace for the company.
- Invite or create team members and assign appropriate roles.
- Control access to sensitive functions.
- Review important actions through audit logs.
- Monitor work, documents, orders, and organizational activity in one place.

### For Product Managers

- Turn product plans into projects, tasks, and assigned work.
- Track development and quality status.
- Review team workload and delivery reports.
- Share documents and communicate updates with the delivery team.

### For Team Leads

- Assign tasks to developers and coordinate testing.
- Follow blockers and bugs.
- Track team progress using dashboards, reports, and activity feeds.
- Keep discussions and supporting files connected to the relevant work item.

### For Developers

- See assigned work and relevant project context.
- Update task and bug progress.
- Discuss requirements and technical details through comments.
- Attach supporting files and receive immediate notifications.

### For Testers

- Review work ready for testing.
- Create detailed bug reports with severity and priority.
- Attach evidence and discuss defects with developers.
- Update bug state as fixes are verified.

## 9. Primary Use Cases

### Use Case 1: Company Onboarding

1. A company registers on the platform.
2. The system creates a tenant and its first super admin.
3. The super admin creates users and assigns their roles.
4. Each user logs in and receives access appropriate to their responsibilities.

### Use Case 2: Product Delivery

1. A product manager creates a project.
2. The manager or team lead creates and assigns tasks.
3. Developers view and update their work.
4. Comments and documents keep requirements and discussions attached to the work.
5. Managers use dashboards and reports to monitor progress.

### Use Case 3: Bug Reporting and Resolution

1. A tester finds a defect and creates a bug with severity and priority.
2. The bug is assigned to a developer.
3. The developer updates the bug and discusses the solution in comments.
4. The tester verifies the fix and updates the bug status.
5. Notifications keep the relevant users informed throughout the process.

### Use Case 4: Document Collaboration

1. A user uploads a specification, screenshot, invoice, or attachment.
2. The document is linked to the appropriate project, task, bug, comment, or order.
3. The file is stored securely in S3.
4. Authorized users request a temporary signed URL to download it.

### Use Case 5: Order Processing

1. An authorized user creates an order.
2. The API saves it and places a processing job on a queue.
3. A background worker processes the order and updates its status.
4. Invoices and supporting attachments can be added.
5. Users receive status information without the original request waiting for processing to finish.

### Use Case 6: Notifications and Communication

1. A business action creates a notification or domain event.
2. The event is saved where applicable and emitted over Socket.IO.
3. Connected users receive the update in real time.
4. Users can view unread counts and mark, archive, or delete notifications.

### Use Case 7: Management Reporting

1. Managers open a dashboard or request a report.
2. The backend aggregates tenant projects, tasks, bugs, orders, and team workload.
3. Search helps users locate relevant records across modules.
4. Audit records help administrators investigate important changes.

## 10. Example End-to-End Scenario

Consider a software company building an e-commerce application:

1. The company owner registers and becomes the super admin.
2. The admin adds a product manager, a team lead, developers, and testers.
3. The product manager creates an **Online Payments** project.
4. The team lead creates tasks for checkout UI, payment API integration, and automated tests.
5. Developers update task progress and attach technical documents.
6. A tester discovers that declined cards show the wrong message and creates a high-priority bug.
7. The assigned developer fixes it, adds a comment, and updates the bug.
8. The tester verifies the fix.
9. Notifications inform the relevant team members, while dashboards and reports show the updated delivery status.
10. The administrator can later review important changes through the audit history.

This scenario demonstrates how the modules work together as one coordinated product-delivery platform.

## 11. Technical Summary

| Area | Technology |
| --- | --- |
| Runtime and language | Node.js 20 and TypeScript |
| API framework | Express |
| Database | MongoDB with Mongoose |
| Authentication | JWT access tokens, refresh sessions, and bcrypt password hashing |
| Validation | Zod |
| Authorization | Centralized role-based permissions plus tenant and ownership checks |
| Background jobs | Redis and BullMQ |
| Real-time communication | Socket.IO |
| File storage | AWS S3; Cloudinary configuration is also available for images |
| Security | Helmet, CORS allowlist, rate limiting, request limits, and Mongo query sanitization |
| Logging | Pino and pino-http |
| Testing | Jest, ts-jest, and Supertest |
| API documentation | Swagger/OpenAPI and Postman |

## 12. Current Scope and Possible Future Enhancements

The current backend is a strong platform foundation, but a full commercial product could extend it with:

- A web or mobile frontend.
- Email invitations and password-reset flows.
- Fine-grained custom roles and per-project permissions.
- Kanban boards, sprints, milestones, and time tracking.
- Full-text search infrastructure for larger datasets.
- Production email-provider integration and templates.
- Billing, subscriptions, and tenant plans.
- Richer order/payment integration.
- File versioning and collaborative document editing.
- More automated end-to-end and load testing.

## 13. Conclusion

This backend was built to give organizations a secure and extensible foundation for managing product delivery and related operations. Its main strengths are tenant isolation, clear team roles, centralized permissions, modular business features, secure file handling, real-time notifications, background processing, and management visibility.

For users, it reduces the need to move between disconnected systems and keeps projects, tasks, bugs, discussions, files, notifications, reports, and selected operational workflows within one consistent platform.
