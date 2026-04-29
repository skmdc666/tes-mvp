import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema-sqlite';
import { sql } from 'drizzle-orm';

// Initialize database with tables
function initDatabase() {
  const connectionString = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
  const client = new Database(connectionString);
  const db = drizzle(client, { schema });

  console.log('Creating database tables...');

  // Create tables using raw SQL
  const createTables = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      is_active BOOLEAN DEFAULT true NOT NULL,
      email_verified BOOLEAN DEFAULT false NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'active' NOT NULL,
      color VARCHAR(7) DEFAULT '#3B82F6' NOT NULL,
      is_public BOOLEAN DEFAULT false NOT NULL,
      created_by TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Tasks table
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'todo' NOT NULL,
      priority VARCHAR(20) DEFAULT 'medium' NOT NULL,
      type VARCHAR(20) DEFAULT 'task' NOT NULL,
      assignee_id TEXT REFERENCES users(id),
      reporter_id TEXT REFERENCES users(id) NOT NULL,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
      due_date TIMESTAMP,
      start_date TIMESTAMP,
      completed_at TIMESTAMP,
      estimated_hours INTEGER,
      actual_hours INTEGER,
      tags JSON DEFAULT '[]' NOT NULL,
      parent_task_id TEXT REFERENCES tasks(id),
      position INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Task comments table
    CREATE TABLE IF NOT EXISTS task_comments (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL,
      is_edited BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Task attachments table
    CREATE TABLE IF NOT EXISTS task_attachments (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      uploaded_by TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Project members table
    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      role VARCHAR(20) DEFAULT 'member' NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      is_active BOOLEAN DEFAULT true NOT NULL
    );

    -- Task history table
    CREATE TABLE IF NOT EXISTS task_history (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      action VARCHAR(50) NOT NULL,
      from_value TEXT,
      to_value TEXT,
      field VARCHAR(50),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      ip_address TEXT,
      user_agent TEXT
    );

    -- Refresh tokens table
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      revoked BOOLEAN DEFAULT false NOT NULL
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_reporter ON tasks(reporter_id);
    CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
    CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
  `;

  try {
    client.exec(createTables);
    console.log('Database tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    client.close();
  }
}

initDatabase();