-- TES MVP Development Database Initialization Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assignee_id UUID REFERENCES users(id),
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_tasks junction table
CREATE TABLE IF NOT EXISTS project_tasks (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, task_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changes JSONB,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create sample development data
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('admin@tes.com', '$2b$10$example_hash', 'Admin', 'User'),
('alex.chen@tes.com', '$2b$10$example_hash', 'Alex', 'Chen'),
('developer@tes.com', '$2b$10$example_hash', 'Developer', 'User')
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (name, description, created_by_id) VALUES
('TES MVP', 'The Expanse Solutions Minimum Viable Product', (SELECT id FROM users WHERE email = 'admin@tes.com')),
('Customer Portal', 'Customer-facing portal for TES services', (SELECT id FROM users WHERE email = 'admin@tes.com')),
('Internal Tools', 'Internal productivity and monitoring tools', (SELECT id FROM users WHERE email = 'developer@tes.com'))
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (title, description, status, priority, created_by_id, project_id) VALUES
-- TES MVP Project Tasks
('Build MVP Backend API', 'Create Express.js API with authentication and task management', 'in_progress', 'high', (SELECT id FROM users WHERE email = 'admin@tes.com'), (SELECT id FROM projects WHERE name = 'TES MVP')),
('Setup Database Schema', 'Design and implement PostgreSQL database with proper relationships', 'completed', 'high', (SELECT id FROM users WHERE email = 'admin@tes.com'), (SELECT id FROM projects WHERE name = 'TES MVP')),
('Implement User Authentication', 'JWT-based authentication with refresh tokens', 'todo', 'high', (SELECT id FROM users WHERE email = 'admin@tes.com'), (SELECT id FROM projects WHERE name = 'TES MVP')),
('Create Frontend Interface', 'React.js frontend for task management and project viewing', 'todo', 'medium', (SELECT id FROM users WHERE email = 'alex.chen@tes.com'), (SELECT id FROM projects WHERE name = 'TES MVP')),
('Setup CI/CD Pipeline', 'Automated testing and deployment to Railway', 'completed', 'medium', (SELECT id FROM users WHERE email = 'admin@tes.com'), (SELECT id FROM projects WHERE name = 'TES MVP')),
('Write API Documentation', 'Comprehensive API documentation with examples', 'todo', 'low', (SELECT id FROM users WHERE email = 'alex.chen@tes.com'), (SELECT id FROM projects WHERE name = 'TES MVP')),

-- Customer Portal Project Tasks
('Design Customer Dashboard', 'Customer dashboard showing service status and usage metrics', 'todo', 'high', (SELECT id FROM users WHERE email = 'alex.chen@tes.com'), (SELECT id FROM projects WHERE name = 'Customer Portal')),
('Implement Payment Integration', 'Stripe integration for subscription management', 'todo', 'high', (SELECT id FROM users WHERE email = 'admin@tes.com'), (SELECT id FROM projects WHERE name = 'Customer Portal')),
('Customer Support Portal', 'Ticketing system for customer support requests', 'todo', 'medium', (SELECT id FROM users WHERE email = 'developer@tes.com'), (SELECT id FROM projects WHERE name = 'Customer Portal')),

-- Internal Tools Project Tasks
('Analytics Dashboard', 'Internal dashboard for usage analytics and revenue tracking', 'in_progress', 'medium', (SELECT id FROM users WHERE email = 'developer@tes.com'), (SELECT id FROM projects WHERE name = 'Internal Tools')),
('Automated Reporting', 'Automated daily/weekly reports for stakeholders', 'todo', 'low', (SELECT id FROM users WHERE email = 'developer@tes.com'), (SELECT id FROM projects WHERE name = 'Internal Tools'))
ON CONFLICT (id) DO NOTHING;

-- Create sample comments
INSERT INTO comments (task_id, user_id, content) VALUES
((SELECT id FROM tasks WHERE title = 'Build MVP Backend API'), (SELECT id FROM users WHERE email = 'admin@tes.com'), 'Started building the Express.js server with basic endpoints.'),
((SELECT id FROM tasks WHERE title = 'Setup Database Schema'), (SELECT id FROM users WHERE email = 'admin@tes.com'), 'Database schema created with all necessary tables and relationships.'),
((SELECT id FROM tasks WHERE title = 'Build MVP Backend API'), (SELECT id FROM users WHERE email = 'alex.chen@tes.com'), 'Added authentication middleware and JWT token generation.')
ON CONFLICT (id) DO NOTHING;