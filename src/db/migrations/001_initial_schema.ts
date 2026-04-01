import type { MigrationBuilder } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Enable UUID extension
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Create users table
  pgm.createTable('users', {
    id: {
      type: 'text',
      primaryKey: true,
      default: sql`cuid()`,
    },
    email: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'text',
      notNull: true,
    },
    first_name: {
      type: 'text',
    },
    last_name: {
      type: 'text',
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    email_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    avatar_url: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
  });

  // Create projects table
  pgm.createTable('projects', {
    id: {
      type: 'text',
      primaryKey: true,
      default: sql`cuid()`,
    },
    name: {
      type: 'text',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'active',
    },
    color: {
      type: 'varchar(7)',
      notNull: true,
      default: '#3B82F6',
    },
    is_public: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_by: {
      type: 'text',
      notNull: true,
      references: {
        name: 'users',
        onDelete: 'CASCADE',
      },
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
  });

  // Create tasks table
  pgm.createTable('tasks', {
    id: {
      type: 'text',
      primaryKey: true,
      default: sql`cuid()`,
    },
    title: {
      type: 'text',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'todo',
    },
    priority: {
      type: 'varchar(20)',
      notNull: true,
      default: 'medium',
    },
    type: {
      type: 'varchar(20)',
      notNull: true,
      default: 'task',
    },
    assignee_id: {
      type: 'text',
      references: {
        name: 'users',
        onDelete: 'SET NULL',
      },
    },
    reporter_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'users',
        onDelete: 'CASCADE',
      },
    },
    project_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'projects',
        onDelete: 'CASCADE',
      },
    },
    due_date: {
      type: 'timestamp',
    },
    start_date: {
      type: 'timestamp',
    },
    completed_at: {
      type: 'timestamp',
    },
    estimated_hours: {
      type: 'integer',
    },
    actual_hours: {
      type: 'integer',
    },
    tags: {
      type: 'jsonb',
      notNull: true,
      default: sql`'[]'::jsonb`,
    },
    parent_task_id: {
      type: 'text',
      references: {
        name: 'tasks',
        onDelete: 'SET NULL',
      },
    },
    position: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
  });

  // Create task comments table
  pgm.createTable('task_comments', {
    id: {
      type: 'text',
      primaryKey: true,
      default: sql`cuid()`,
    },
    task_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'tasks',
        onDelete: 'CASCADE',
      },
    },
    user_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'users',
        onDelete: 'CASCADE',
      },
    },
    content: {
      type: 'text',
      notNull: true,
    },
    is_edited: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
  });

  // Create task attachments table
  pgm.createTable('task_attachments', {
    id: {
      type: 'text',
      primaryKey: true,
      default: sql`cuid()`,
    },
    task_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'tasks',
        onDelete: 'CASCADE',
      },
    },
    file_name: {
      type: 'text',
      notNull: true,
    },
    file_url: {
      type: 'text',
      notNull: true,
    },
    file_size: {
      type: 'integer',
    },
    mime_type: {
      type: 'text',
    },
    uploaded_by: {
      type: 'text',
      notNull: true,
      references: {
        name: 'users',
        onDelete: 'CASCADE',
      },
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
  });

  // Create project members table
  pgm.createTable('project_members', {
    id: {
      type: 'text',
      primaryKey: true,
      default: sql`cuid()`,
    },
    project_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'projects',
        onDelete: 'CASCADE',
      },
    },
    user_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'users',
        onDelete: 'CASCADE',
      },
    },
    role: {
      type: 'varchar(20)',
      notNull: true,
      default: 'member',
    },
    joined_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
  });

  // Create task history table
  pgm.createTable('task_history', {
    id: {
      type: 'text',
      primaryKey: true,
      default: sql`cuid()`,
    },
    task_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'tasks',
        onDelete: 'CASCADE',
      },
    },
    user_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'users',
        onDelete: 'CASCADE',
      },
    },
    action: {
      type: 'varchar(50)',
      notNull: true,
    },
    from_value: {
      type: 'text',
    },
    to_value: {
      type: 'text',
    },
    field: {
      type: 'varchar(50)',
    },
    comment: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
  });

  // Create sessions table
  pgm.createTable('sessions', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    user_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'users',
        onDelete: 'CASCADE',
      },
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    ip_address: {
      type: 'text',
    },
    user_agent: {
      type: 'text',
    },
  });

  // Create refresh tokens table
  pgm.createTable('refresh_tokens', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    user_id: {
      type: 'text',
      notNull: true,
      references: {
        name: 'users',
        onDelete: 'CASCADE',
      },
    },
    token_hash: {
      type: 'text',
      notNull: true,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: sql`CURRENT_TIMESTAMP`,
    },
    revoked: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
  });

  // Create indexes for performance
  pgm.createIndex('users_email_idx', 'users', ['email']);
  pgm.createIndex('projects_created_by_idx', 'projects', ['created_by']);
  pgm.createIndex('tasks_project_idx', 'tasks', ['project_id']);
  pgm.createIndex('tasks_assignee_idx', 'tasks', ['assignee_id']);
  pgm.createIndex('tasks_reporter_idx', 'tasks', ['reporter_id']);
  pgm.createIndex('task_comments_task_idx', 'task_comments', ['task_id']);
  pgm.createIndex('task_comments_user_idx', 'task_comments', ['user_id']);
  pgm.createIndex('task_attachments_task_idx', 'task_attachments', ['task_id']);
  pgm.createIndex('task_history_task_idx', 'task_history', ['task_id']);
  pgm.createIndex('sessions_user_idx', 'sessions', ['user_id']);
  pgm.createIndex('sessions_expires_idx', 'sessions', ['expires_at']);
  pgm.createIndex('refresh_tokens_user_idx', 'refresh_tokens', ['user_id']);
  pgm.createIndex('refresh_tokens_expires_idx', 'refresh_tokens', ['expires_at']);
  pgm.createIndex('project_members_project_idx', 'project_members', ['project_id']);
  pgm.createIndex('project_members_user_idx', 'project_members', ['user_id']);

  // Create unique constraint for project members
  pgm.addConstraint('project_members', 'project_members_unique', {
    unique: ['project_id', 'user_id'],
  });

  // Create function to update updated_at timestamp
  pgm.createFunction(
    'update_updated_at_column',
    [],
    'trigger',
    `
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
    `,
    { returns: 'trigger' }
  );

  // Create triggers for updated_at
  pgm.createTrigger('users', 'update_users_updated_at', {
    level: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    language: 'plpgsql',
  });

  pgm.createTrigger('projects', 'update_projects_updated_at', {
    level: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    language: 'plpgsql',
  });

  pgm.createTrigger('tasks', 'update_tasks_updated_at', {
    level: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    language: 'plpgsql',
  });

  pgm.createTrigger('task_comments', 'update_task_comments_updated_at', {
    level: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    language: 'plpgsql',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop all tables in reverse order of creation
  pgm.dropTable('refresh_tokens', { ifExists: true });
  pgm.dropTable('sessions', { ifExists: true });
  pgm.dropTable('task_history', { ifExists: true });
  pgm.dropTable('project_members', { ifExists: true });
  pgm.dropTable('task_attachments', { ifExists: true });
  pgm.dropTable('task_comments', { ifExists: true });
  pgm.dropTable('tasks', { ifExists: true });
  pgm.dropTable('projects', { ifExists: true });
  pgm.dropTable('users', { ifExists: true });

  // Drop functions and triggers
  pgm.dropFunction('update_updated_at_column', { ifExists: true });
}