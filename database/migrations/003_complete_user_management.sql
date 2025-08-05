-- Migration 003: Complete User Management
-- Add remaining columns and create new tables for user management

-- Add remaining columns to users_tbl (only if they don't exist)
ALTER TABLE users_tbl ADD COLUMN locked_until TEXT;
ALTER TABLE users_tbl ADD COLUMN password_changed_date TEXT;
ALTER TABLE users_tbl ADD COLUMN created_by INTEGER;
ALTER TABLE users_tbl ADD COLUMN updated_at TEXT;

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
);

-- Create user_activity_log table for audit logging
CREATE TABLE IF NOT EXISTS user_activity_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    activity_type TEXT NOT NULL,
    activity_description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE SET NULL
);

-- Create user_permissions table for role-based access control
CREATE TABLE IF NOT EXISTS user_permissions (
    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT NOT NULL,
    resource_name TEXT NOT NULL,
    action_name TEXT NOT NULL,
    is_allowed INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(role_name, resource_name, action_name)
);

-- Insert default permissions for Administrator role
INSERT OR IGNORE INTO user_permissions (role_name, resource_name, action_name) VALUES
('Administrator', 'users', 'create'),
('Administrator', 'users', 'read'),
('Administrator', 'users', 'update'),
('Administrator', 'users', 'delete'),
('Administrator', 'entries', 'create'),
('Administrator', 'entries', 'read'),
('Administrator', 'entries', 'update'),
('Administrator', 'entries', 'delete'),
('Administrator', 'reports', 'create'),
('Administrator', 'reports', 'read'),
('Administrator', 'reports', 'export'),
('Administrator', 'system', 'admin');

-- Insert default permissions for User role
INSERT OR IGNORE INTO user_permissions (role_name, resource_name, action_name) VALUES
('User', 'entries', 'create'),
('User', 'entries', 'read'),
('User', 'entries', 'update'),
('User', 'reports', 'read');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_permissions_role ON user_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users_tbl(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users_tbl(is_active);
CREATE INDEX IF NOT EXISTS idx_users_department ON users_tbl(department);

-- Update existing users with default values
UPDATE users_tbl SET 
    email = username || '@lvd.gov.ng',
    full_name = username,
    department = 'General',
    is_active = 1,
    password_changed_date = user_creation_date
WHERE email IS NULL; 