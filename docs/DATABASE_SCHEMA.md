# Database Schema - Records Management System

## 📋 Overview

The Records Management System uses SQLite as its database engine. The database contains two main tables: `entries_tbl` for storing file and letter records, and `users_tbl` for user authentication.

**Database File**: `database/recordsmgmtsys.db`

**Engine**: SQLite3

**Version**: 3.x

## 🏗️ Database Architecture

### Database Location

```javascript
// Development Mode
dbPath = path.resolve(__dirname, "./database/recordsmgmtsys.db");

// Production Mode
dbPath = path.join(app.getPath("userData"), "recordsmgmtsys.db");
```

### Database Initialization

```javascript
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
  } else {
    console.log("Connected to the SQLite database at", dbPath);
  }
});
```

## 📊 Table Schemas

### 1. entries_tbl (Core Records Table)

The main table that stores all file and letter records.

#### Table Structure

```sql
CREATE TABLE entries_tbl (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    entry_category TEXT NOT NULL CHECK(entry_category IN ('File', 'Letter')),
    file_number TEXT NOT NULL,
    subject TEXT NOT NULL,
    officer_assigned TEXT NOT NULL,
    recieved_date TEXT,           -- Note: Misspelled (should be received_date)
    date_sent TEXT,
    file_type TEXT,
    reciepient TEXT,              -- Note: Misspelled (should be recipient)
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('IN', 'OUT', 'FILED', 'PENDING')),
    letter_date TEXT,             -- Letter-specific field
    letter_type TEXT,             -- Letter-specific field
    folio_number TEXT             -- Letter-specific field
);
```

#### Field Descriptions

| Field              | Type    | Required | Description                             | Constraints                                      |
| ------------------ | ------- | -------- | --------------------------------------- | ------------------------------------------------ |
| `entry_id`         | INTEGER | Yes      | Primary key, auto-increment             | PRIMARY KEY, AUTOINCREMENT                       |
| `entry_date`       | TEXT    | Yes      | Date when entry was created             | NOT NULL, Format: YYYY-MM-DD                     |
| `entry_category`   | TEXT    | Yes      | Type of entry                           | NOT NULL, CHECK('File' OR 'Letter')              |
| `file_number`      | TEXT    | Yes      | Unique file/letter number               | NOT NULL                                         |
| `subject`          | TEXT    | Yes      | Subject/title of the entry              | NOT NULL                                         |
| `officer_assigned` | TEXT    | Yes      | Officer responsible for the entry       | NOT NULL                                         |
| `recieved_date`    | TEXT    | No       | Date when item was received             | Format: YYYY-MM-DD                               |
| `date_sent`        | TEXT    | No       | Date when item was sent                 | Format: YYYY-MM-DD                               |
| `file_type`        | TEXT    | No       | Type of file (Internal, External, etc.) | NULL                                             |
| `reciepient`       | TEXT    | No       | Recipient of the file/letter            | NULL                                             |
| `description`      | TEXT    | No       | Additional description                  | NULL                                             |
| `status`           | TEXT    | Yes      | Current status of the entry             | NOT NULL, CHECK('IN', 'OUT', 'FILED', 'PENDING') |
| `letter_date`      | TEXT    | No       | Date of the letter (Letter-specific)    | Format: YYYY-MM-DD                               |
| `letter_type`      | TEXT    | No       | Type of letter (Incoming, Outgoing)     | NULL                                             |
| `folio_number`     | TEXT    | No       | Folio number for letters                | NULL                                             |

#### Data Validation Rules

```sql
-- Entry Category Validation
CHECK(entry_category IN ('File', 'Letter'))

-- Status Validation
CHECK(status IN ('IN', 'OUT', 'FILED', 'PENDING'))

-- Date Format Validation (Application Level)
-- All date fields should be in YYYY-MM-DD format
```

#### Sample Data

```sql
-- File Entry
INSERT INTO entries_tbl (
    entry_date, entry_category, file_number, subject,
    officer_assigned, recieved_date, date_sent, file_type,
    reciepient, description, status
) VALUES (
    '2024-01-15', 'File', 'F001/2024', 'Sample File Subject',
    'CLAO/C1', '2024-01-10', '2024-01-20', 'Internal',
    'Department A', 'Sample file description', 'IN'
);

-- Letter Entry
INSERT INTO entries_tbl (
    entry_date, entry_category, file_number, subject,
    officer_assigned, recieved_date, letter_date, letter_type,
    folio_number, description, status
) VALUES (
    '2024-01-15', 'Letter', 'L001/2024', 'Sample Letter Subject',
    'CLAO/C1', '2024-01-10', '2024-01-12', 'Incoming',
    'FOL001', 'Sample letter description', 'IN'
);
```

### 2. users_tbl (User Authentication Table)

Stores user credentials and role information.

#### Table Structure

```sql
CREATE TABLE users_tbl (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,       -- Note: Currently plain text
    user_role TEXT DEFAULT 'user' CHECK(user_role IN ('admin', 'user', 'officer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Field Descriptions

| Field        | Type     | Required | Description                 | Constraints                                       |
| ------------ | -------- | -------- | --------------------------- | ------------------------------------------------- |
| `user_id`    | INTEGER  | Yes      | Primary key, auto-increment | PRIMARY KEY, AUTOINCREMENT                        |
| `username`   | TEXT     | Yes      | Unique username for login   | UNIQUE, NOT NULL                                  |
| `password`   | TEXT     | Yes      | User password               | NOT NULL (should be hashed)                       |
| `user_role`  | TEXT     | No       | User role/permissions       | DEFAULT 'user', CHECK('admin', 'user', 'officer') |
| `created_at` | DATETIME | No       | Account creation timestamp  | DEFAULT CURRENT_TIMESTAMP                         |

#### Data Validation Rules

```sql
-- Username Uniqueness
UNIQUE(username)

-- User Role Validation
CHECK(user_role IN ('admin', 'user', 'officer'))

-- Default Role
DEFAULT 'user'
```

#### Sample Data

```sql
INSERT INTO users_tbl (username, password, user_role) VALUES
('admin', 'admin123', 'admin'),
('officer1', 'officer123', 'officer'),
('user1', 'user123', 'user');
```

## 🔍 Indexes and Performance

### Recommended Indexes

```sql
-- Primary Indexes (Auto-created)
-- entry_id (PRIMARY KEY)
-- user_id (PRIMARY KEY)

-- Performance Indexes
CREATE INDEX idx_entries_date ON entries_tbl(entry_date);
CREATE INDEX idx_entries_category ON entries_tbl(entry_category);
CREATE INDEX idx_entries_status ON entries_tbl(status);
CREATE INDEX idx_entries_officer ON entries_tbl(officer_assigned);
CREATE INDEX idx_entries_file_number ON entries_tbl(file_number);
CREATE INDEX idx_users_username ON users_tbl(username);
CREATE INDEX idx_users_role ON users_tbl(user_role);
```

### Query Optimization

```sql
-- Recent entries query (Dashboard)
SELECT entry_id, entry_date, entry_category, file_number,
       subject, officer_assigned, status
FROM entries_tbl
ORDER BY entry_date DESC
LIMIT 6;

-- Statistics query (Dashboard)
SELECT
    COUNT(*) AS total_entries,
    SUM(CASE WHEN entry_category = 'Letter' THEN 1 ELSE 0 END) AS total_letters,
    SUM(CASE WHEN entry_category = 'File' THEN 1 ELSE 0 END) AS total_files
FROM entries_tbl;

-- Filtered reports query
SELECT entry_id, entry_date, entry_category, file_number,
       subject, officer_assigned, status
FROM entries_tbl
WHERE entry_date >= ? AND entry_date <= ?
  AND officer_assigned LIKE ?
  AND status = ?
ORDER BY entry_date DESC;
```

## 🔒 Data Integrity

### Constraints

```sql
-- Primary Key Constraints
PRIMARY KEY (entry_id)
PRIMARY KEY (user_id)

-- Foreign Key Constraints (Future Implementation)
-- Currently no foreign key relationships

-- Check Constraints
CHECK(entry_category IN ('File', 'Letter'))
CHECK(status IN ('IN', 'OUT', 'FILED', 'PENDING'))
CHECK(user_role IN ('admin', 'user', 'officer'))

-- Unique Constraints
UNIQUE(username)
```

### Data Validation Rules

#### Application-Level Validation

```javascript
// Date Format Validation
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Required Field Validation
function validateRequiredFields(data, requiredFields) {
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

// Status Validation
const validStatuses = ["IN", "OUT", "FILED", "PENDING"];
function isValidStatus(status) {
  return validStatuses.includes(status);
}

// Category Validation
const validCategories = ["File", "Letter"];
function isValidCategory(category) {
  return validCategories.includes(category);
}
```

## 🚨 Known Issues

### Current Problems

1. **Spelling Inconsistencies**:

   - `recieved_date` should be `received_date`
   - `reciepient` should be `recipient`

2. **Security Issues**:

   - Passwords stored in plain text
   - No password complexity requirements
   - No account lockout mechanism

3. **Data Integrity Issues**:
   - No foreign key relationships
   - Limited constraint checking
   - No audit trail

### Recommended Fixes

```sql
-- Fix spelling issues (Migration)
ALTER TABLE entries_tbl RENAME COLUMN recieved_date TO received_date;
ALTER TABLE entries_tbl RENAME COLUMN reciepient TO recipient;

-- Add password hashing (Application level)
-- Implement bcrypt for password hashing

-- Add audit trail table
CREATE TABLE audit_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_entries_received_date ON entries_tbl(received_date);
CREATE INDEX idx_entries_recipient ON entries_tbl(recipient);
```

## 📊 Database Statistics

### Table Sizes

```sql
-- Get table row counts
SELECT
    'entries_tbl' as table_name,
    COUNT(*) as row_count
FROM entries_tbl
UNION ALL
SELECT
    'users_tbl' as table_name,
    COUNT(*) as row_count
FROM users_tbl;
```

### Data Distribution

```sql
-- Entry category distribution
SELECT
    entry_category,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM entries_tbl), 2) as percentage
FROM entries_tbl
GROUP BY entry_category;

-- Status distribution
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM entries_tbl), 2) as percentage
FROM entries_tbl
GROUP BY status;

-- Officer assignment distribution
SELECT
    officer_assigned,
    COUNT(*) as count
FROM entries_tbl
GROUP BY officer_assigned
ORDER BY count DESC;
```

## 🔧 Maintenance Scripts

### Backup Script

```javascript
const fs = require("fs");
const path = require("path");

function backupDatabase() {
  const dbPath = path.resolve(__dirname, "./database/recordsmgmtsys.db");
  const backupPath = path.resolve(
    __dirname,
    `./database/backup_${Date.now()}.db`
  );

  fs.copyFileSync(dbPath, backupPath);
  console.log(`Database backed up to: ${backupPath}`);
}
```

### Cleanup Script

```sql
-- Remove duplicate entries (if any)
DELETE FROM entries_tbl
WHERE entry_id NOT IN (
    SELECT MIN(entry_id)
    FROM entries_tbl
    GROUP BY file_number, entry_category
);

-- Clean up orphaned records
-- (Future implementation when foreign keys are added)

-- Vacuum database to reclaim space
VACUUM;
```

### Migration Scripts

```sql
-- Migration 1: Fix spelling issues
BEGIN TRANSACTION;

-- Create new table with correct spelling
CREATE TABLE entries_tbl_new (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    entry_category TEXT NOT NULL CHECK(entry_category IN ('File', 'Letter')),
    file_number TEXT NOT NULL,
    subject TEXT NOT NULL,
    officer_assigned TEXT NOT NULL,
    received_date TEXT,           -- Fixed spelling
    date_sent TEXT,
    file_type TEXT,
    recipient TEXT,               -- Fixed spelling
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('IN', 'OUT', 'FILED', 'PENDING')),
    letter_date TEXT,
    letter_type TEXT,
    folio_number TEXT
);

-- Copy data with corrected column names
INSERT INTO entries_tbl_new
SELECT
    entry_id, entry_date, entry_category, file_number, subject,
    officer_assigned, recieved_date as received_date, date_sent,
    file_type, reciepient as recipient, description, status,
    letter_date, letter_type, folio_number
FROM entries_tbl;

-- Drop old table and rename new one
DROP TABLE entries_tbl;
ALTER TABLE entries_tbl_new RENAME TO entries_tbl;

COMMIT;
```

## 📈 Performance Monitoring

### Query Performance

```sql
-- Enable query timing
.timer on

-- Analyze query performance
EXPLAIN QUERY PLAN
SELECT * FROM entries_tbl
WHERE entry_date >= '2024-01-01'
  AND entry_date <= '2024-01-31'
ORDER BY entry_date DESC;
```

### Database Size Monitoring

```sql
-- Get database size
SELECT
    page_count * page_size as size_bytes,
    page_count * page_size / 1024.0 as size_kb,
    page_count * page_size / 1024.0 / 1024.0 as size_mb
FROM pragma_page_count(), pragma_page_size();
```

## 🔄 Backup and Recovery

### Backup Strategy

1. **Daily Backups**: Automated daily backups
2. **Weekly Backups**: Full database dumps
3. **Monthly Backups**: Compressed archives
4. **Before Updates**: Pre-update backups

### Recovery Procedures

```bash
# Restore from backup
cp backup_20240115.db recordsmgmtsys.db

# Verify database integrity
sqlite3 recordsmgmtsys.db "PRAGMA integrity_check;"

# Rebuild indexes if needed
sqlite3 recordsmgmtsys.db "REINDEX;"
```

---

_Last Updated: [Current Date]_
_Version: 1.0.0_
