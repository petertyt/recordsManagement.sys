-- Migration: Fix spelling inconsistencies in database schema
-- Date: 2024-01-XX
-- Description: Fix spelling inconsistencies in column names

-- Backup the current table structure
CREATE TABLE entries_tbl_backup AS SELECT * FROM entries_tbl;

-- Create new table with corrected column names
CREATE TABLE entries_tbl_new (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    entry_category TEXT NOT NULL,
    file_number TEXT,
    subject TEXT,
    officer_assigned TEXT,
    date_sent TEXT,
    received_date TEXT,  -- Fixed: was 'recieved_date'
    letter_date TEXT,
    recipient TEXT,      -- Fixed: was 'reciepient'
    letter_type TEXT,
    folio_number TEXT,
    file_type TEXT,
    description TEXT,
    status TEXT
);

-- Copy data from old table to new table with corrected column names
INSERT INTO entries_tbl_new (
    entry_id,
    entry_date,
    entry_category,
    file_number,
    subject,
    officer_assigned,
    date_sent,
    received_date,  -- Fixed column name
    letter_date,
    recipient,      -- Fixed column name
    letter_type,
    folio_number,
    file_type,
    description,
    status
)
SELECT 
    entry_id,
    entry_date,
    entry_category,
    file_number,
    subject,
    officer_assigned,
    date_sent,
    recieved_date,  -- Old column name
    letter_date,
    reciepient,     -- Old column name
    letter_type,
    folio_number,
    file_type,
    description,
    status
FROM entries_tbl;

-- Drop the old table
DROP TABLE entries_tbl;

-- Rename new table to original name
ALTER TABLE entries_tbl_new RENAME TO entries_tbl;

-- Create indexes for better performance
CREATE INDEX idx_entries_file_number ON entries_tbl(file_number);
CREATE INDEX idx_entries_entry_date ON entries_tbl(entry_date);
CREATE INDEX idx_entries_officer_assigned ON entries_tbl(officer_assigned);
CREATE INDEX idx_entries_status ON entries_tbl(status);
CREATE INDEX idx_entries_category ON entries_tbl(entry_category);

-- Add unique constraint for file_number (only if not null)
CREATE INDEX idx_entries_file_number_unique ON entries_tbl(file_number) WHERE file_number IS NOT NULL;

-- Update the backup table name for reference
ALTER TABLE entries_tbl_backup RENAME TO entries_tbl_backup_001_spelling_fix;

-- Log the migration
INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES ('001_fix_spelling_inconsistencies', CURRENT_TIMESTAMP, 'Fixed spelling inconsistencies: recieved_date -> received_date, reciepient -> recipient'); 