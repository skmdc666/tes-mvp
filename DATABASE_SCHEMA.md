# TES MVP Database Schema Documentation

## Overview

The TES MVP uses **PostgreSQL** with **Drizzle ORM** for type-safe database operations. The schema is designed to support task management, project organization, user authentication, and activity tracking.

## Database Tables

### Core Tables

#### Users
Stores user account information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-----------|---|
| id | TEXT | PRIMARY KEY, DEFAULT: cuid() | Unique user identifier |
| email | TEXT | NOT NULL, UNIQUE | User email address |
| password_hash | TEXT | NOT NULL | Bcrypt-hashed password |
| first_name | TEXT | NULL | User's first name |
| last_name | TEXT | NULL | User's last name |
| is_active | BOOLEAN | NOT NULL, DEFAULT: true | Account active status |
| email_verified | BOOLEAN | NOT NULL, DEFAULT: false | Email verification status |
| avatar_url | TEXT | NULL | URL to user's avatar image |
| created_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `users_email_idx` on (email) — for fast email lookups during login

---

#### Projects
Represents project entities for organizing tasks.

| Column | Type | Constraints | Description |
|--------|------|-----------|---|
| id | TEXT | PRIMARY KEY, DEFAULT: cuid() | Unique project identifier |
| name | TEXT | NOT NULL | Project name |
| description | TEXT | NULL | Project description |
| status | VARCHAR(20) | NOT NULL, DEFAULT: 'active' | Project status (active, archived, completed) |
| color | VARCHAR(7) | NOT NULL, DEFAULT: '#3B82F6' | Hex color code for UI |
| is_public | BOOLEAN | NOT NULL, DEFAULT: false | Public/private visibility |
| created_by | TEXT | NOT NULL, FK: users.id ON DELETE CASCADE | Project creator |
| created_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `projects_created_by_idx` on (created_by) — for fetching user's projects

---

#### Tasks
Main task management table with support for subtasks and complex workflows.

| Column | Type | Constraints | Description |
|--------|------|-----------|---|
| id | TEXT | PRIMARY KEY, DEFAULT: cuid() | Unique task identifier |
| title | TEXT | NOT NULL | Task title |
| description | TEXT | NULL | Detailed task description |
| status | VARCHAR(20) | NOT NULL, DEFAULT: 'todo' | Task status (todo, in_progress, in_review, done, blocked, cancelled) |
| priority | VARCHAR(20) | NOT NULL, DEFAULT: 'medium' | Priority level (low, medium, high, urgent, critical) |
| type | VARCHAR(20) | NOT NULL, DEFAULT: 'task' | Task type (task, bug, feature, etc.) |
| assignee_id | TEXT | NULL, FK: users.id | Assigned user |
| reporter_id | TEXT | NOT NULL, FK: users.id ON DELETE CASCADE | User who reported/created task |
| project_id | TEXT | NOT NULL, FK: projects.id ON DELETE CASCADE | Associated project |
| due_date | TIMESTAMP | NULL | Task due date |
| start_date | TIMESTAMP | NULL | Task start date |
| completed_at | TIMESTAMP | NULL | Completion timestamp |
| estimated_hours | INTEGER | NULL | Estimated effort in hours |
| actual_hours | INTEGER | NULL | Actual effort spent |
| tags | JSONB | NOT NULL, DEFAULT: '[]' | Array of tags for categorization |
| parent_task_id | TEXT | NULL, FK: tasks.id | Parent task (for subtasks) |
| position | INTEGER | NOT NULL, DEFAULT: 0 | Ordering/priority position |
| created_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `tasks_project_idx` on (project_id) — for fetching project's tasks
- `tasks_assignee_idx` on (assignee_id) — for user's assigned tasks
- `tasks_reporter_idx` on (reporter_id) — for user's reported tasks

---

#### TaskComments
Comments and discussions on tasks.

| Column | Type | Constraints | Description |
|--------|------|-----------|---|
| id | TEXT | PRIMARY KEY, DEFAULT: cuid() | Unique comment identifier |
| task_id | TEXT | NOT NULL, FK: tasks.id ON DELETE CASCADE | Associated task |
| user_id | TEXT | NOT NULL, FK: users.id ON DELETE CASCADE | Comment author |
| content | TEXT | NOT NULL | Comment text content |
| is_edited | BOOLEAN | NOT NULL, DEFAULT: false | Edit status flag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `task_comments_task_idx` on (task_id) — for fetching task comments
- `task_comments_user_idx` on (user_id) — for user's comments

---

#### TaskAttachments
File attachments associated with tasks.

| Column | Type | Constraints | Description |
|--------|------|-----------|---|
| id | TEXT | PRIMARY KEY, DEFAULT: cuid() | Unique attachment identifier |
| task_id | TEXT | NOT NULL, FK: tasks.id ON DELETE CASCADE | Associated task |
| file_name | TEXT | NOT NULL | Original file name |
| file_url | TEXT | NOT NULL | URL/path to file |
| file_size | INTEGER | NULL | File size in bytes |
| mime_type | TEXT | NULL | MIME type (e.g., application/pdf) |
| uploaded_by | TEXT | NOT NULL, FK: users.id ON DELETE CASCADE | Uploader user |
| created_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Upload timestamp |

**Indexes:**
- `task_attachments_task_idx` on (task_id) — for task attachments

---

#### ProjectMembers
Team membership and role assignment for projects.

| Column | Type | Constraints | Description |
|--------|------|-----------|---|
| id | TEXT | PRIMARY KEY, DEFAULT: cuid() | Unique membership identifier |
| project_id | TEXT | NOT NULL, FK: projects.id ON DELETE CASCADE | Associated project |
| user_id | TEXT | NOT NULL, FK: users.id ON DELETE CASCADE | Team member user |
| role | VARCHAR(20) | NOT NULL, DEFAULT: 'member' | Role (owner, admin, member, viewer) |
| joined_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Membership start date |
| is_active | BOOLEAN | NOT NULL, DEFAULT: true | Active membership status |

**Constraints:**
- UNIQUE (project_id, user_id) — prevent duplicate memberships

**Indexes:**
- `project_members_project_idx` on (project_id) — for project members
- `project_members_user_idx` on (user_id) — for user's memberships

---

#### TaskHistory
Audit trail for task changes and activities.

| Column | Type | Constraints | Description |
|--------|------|-----------|---|
| id | TEXT | PRIMARY KEY, DEFAULT: cuid() | Unique history entry identifier |
| task_id | TEXT | NOT NULL, FK: tasks.id ON DELETE CASCADE | Associated task |
| user_id | TEXT | NOT NULL, FK: users.id ON DELETE CASCADE | Acting user |
| action | VARCHAR(50) | NOT NULL | Action type (created, updated, assigned, status_changed, etc.) |
| field | VARCHAR(50) | NULL | Field that changed (title, status, priority, etc.) |
| from_value | TEXT | NULL | Previous value |
| to_value | TEXT | NULL | New value |
| comment | TEXT | NULL | Additional comment/notes |
| created_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Timestamp of change |

**Indexes:**
- `task_history_task_idx` on (task_id) — for task history

---

#### Sessions
User session management for authentication.

| Column | Type | Constraints | Description |
|--------|------|-----------|---|
| id | TEXT | PRIMARY KEY | Session token/identifier |
| user_id | TEXT | NOT NULL, FK: users.id ON DELETE CASCADE | Associated user |
| expires_at | TIMESTAMP | NOT NULL | Session expiration time |
| ip_address | TEXT | NULL | Client IP address |
| user_agent | TEXT | NULL | Browser/client user agent |

**Indexes:**
- `sessions_user_idx` on (user_id) — for user's sessions
- `sessions_expires_idx` on (expires_at) — for cleanup queries

---

#### RefreshTokens
Long-lived refresh tokens for JWT authentication.

| Column | Type | Constraints | Description |
|--------|------|-----------|---|
| id | TEXT | PRIMARY KEY | Token identifier |
| user_id | TEXT | NOT NULL, FK: users.id ON DELETE CASCADE | Token owner |
| token_hash | TEXT | NOT NULL | Hashed token value |
| expires_at | TIMESTAMP | NOT NULL | Token expiration time |
| revoked | BOOLEAN | NOT NULL, DEFAULT: false | Revocation status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Creation timestamp |

**Indexes:**
- `refresh_tokens_user_idx` on (user_id) — for user's tokens
- `refresh_tokens_expires_idx` on (expires_at) — for cleanup queries

---

## Relationships & ER Diagram

```
Users (1) ──────────────→ (M) Projects          [created_by FK]
Users (1) ──────────────→ (M) Tasks             [reporter_id FK, assignee_id FK]
Users (1) ──────────────→ (M) TaskComments      [user_id FK]
Users (1) ──────────────→ (M) TaskAttachments   [uploaded_by FK]
Users (1) ──────────────→ (M) ProjectMembers    [user_id FK]
Users (1) ──────────────→ (M) TaskHistory       [user_id FK]
Users (1) ──────────────→ (M) Sessions          [user_id FK]
Users (1) ──────────────→ (M) RefreshTokens     [user_id FK]

Projects (1) ───────────→ (M) Tasks             [project_id FK]
Projects (1) ───────────→ (M) ProjectMembers    [project_id FK]

Tasks (1) ──────────────→ (M) TaskComments      [task_id FK]
Tasks (1) ──────────────→ (M) TaskAttachments   [task_id FK]
Tasks (1) ──────────────→ (M) TaskHistory       [task_id FK]
Tasks (1) ──────────────→ (1) Tasks             [parent_task_id FK - self-referencing]
```

## Performance Optimizations

### Indexes Summary
Total of 15 indexes created for optimal query performance:

1. **users_email_idx** — Email lookups for authentication
2. **projects_created_by_idx** — Fetch user-created projects
3. **tasks_project_idx** — Fetch project tasks
4. **tasks_assignee_idx** — Fetch user's assigned tasks
5. **tasks_reporter_idx** — Fetch user's reported tasks
6. **task_comments_task_idx** — Fetch task comments
7. **task_comments_user_idx** — Fetch user's comments
8. **task_attachments_task_idx** — Fetch task attachments
9. **task_history_task_idx** — Fetch task history
10. **sessions_user_idx** — Fetch user sessions
11. **sessions_expires_idx** — Cleanup expired sessions
12. **refresh_tokens_user_idx** — Fetch user's tokens
13. **refresh_tokens_expires_idx** — Cleanup expired tokens
14. **project_members_project_idx** — Fetch project members
15. **project_members_user_idx** — Fetch user's memberships

### Automatic Timestamp Management
Triggers automatically update `updated_at` fields on INSERT/UPDATE:
- users
- projects
- tasks
- task_comments

## TypeScript Type Exports

All tables export TypeScript types for type safety:

```typescript
// Inferred from table schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// ... and more for all tables
```

## Enums & Constants

### Task Statuses
- `todo` — Task not started
- `in_progress` — Currently being worked on
- `in_review` — Pending review/approval
- `done` — Task completed
- `blocked` — Cannot progress (dependency/blocker)
- `cancelled` — Intentionally abandoned

### Task Priorities
- `low` — Low priority
- `medium` — Standard priority
- `high` — High priority
- `urgent` — Urgent, needs attention soon
- `critical` — Critical, highest priority

### Project Statuses
- `active` — Project is active
- `archived` — Project archived
- `completed` — Project is completed

### User Roles (in ProjectMembers)
- `owner` — Project owner/creator
- `admin` — Project administrator
- `member` — Regular team member
- `viewer` — Read-only access

## Migration Strategy

### Initial Migration
**File:** `src/db/migrations/001_initial_schema.ts`

Handles:
1. Table creation in dependency order
2. Foreign key relationships
3. Indexes for performance
4. Unique constraints
5. PL/pgSQL triggers for automatic timestamp updates

### Reversibility
Down migration fully reverses all changes:
- Drops all triggers and functions
- Drops all tables in reverse creation order
- Safe to run on any environment

## Development Workflow

### Generate Drizzle Schema Changes
```bash
npm run db:generate
```

### Run Migrations
```bash
npm run db:migrate
```

### Seed Database with Test Data
```bash
npm run db:seed
```

### Open Drizzle Studio (Visual Editor)
```bash
npm run db:studio
```

## Data Integrity

### Referential Integrity
- All foreign keys use `ON DELETE CASCADE` except where noted
- Ensures data consistency and prevents orphaned records
- Tasks created by/assigned to users are automatically cleaned up when user is deleted

### Constraints
- Email addresses are unique per user
- Project members can only be added once per project (unique constraint)
- All required fields are NOT NULL where appropriate

### State Management
- Task status explicitly defines workflow states
- Priority levels provide consistent severity ordering
- Role-based access control through ProjectMembers

## Monitoring Queries

### Recent Activity
```sql
SELECT th.*, t.title, u.email
FROM task_history th
JOIN tasks t ON th.task_id = t.id
JOIN users u ON th.user_id = u.id
ORDER BY th.created_at DESC
LIMIT 50;
```

### User's Tasks
```sql
SELECT t.* FROM tasks t
WHERE t.assignee_id = $1 OR t.reporter_id = $1
ORDER BY t.priority DESC, t.created_at DESC;
```

### Project Activity
```sql
SELECT COUNT(*) as task_count, 
       SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
FROM tasks
WHERE project_id = $1
GROUP BY project_id;
```

---

## Summary

The TES MVP database schema provides a robust foundation for task management with:
- ✅ Type-safe ORM (Drizzle)
- ✅ Comprehensive performance indexes
- ✅ Audit trail for all changes
- ✅ Proper relationship modeling
- ✅ Automatic timestamp management
- ✅ Referential integrity enforcement

**Last Updated:** 2026-04-29
**Status:** Production Ready
