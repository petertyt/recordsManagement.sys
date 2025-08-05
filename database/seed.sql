-- Seed initial users
INSERT INTO users_tbl (username, password, user_role, user_creation_date) VALUES
    ('LVD-ADMIN', 'password', 'Administrator', '2024-09-09'),
    ('LVD-PRUDENCE', 'password', 'User', '2024-09-09'),
    ('LVD-PETER', 'password', 'User', '2024-09-09'),
    ('LVD-ESTHER', 'password', 'User', '2024-09-09'),
    ('LVD-COURAGE', 'password', 'User', '2024-09-09');

-- Optional sample entry
INSERT INTO entries_tbl (entry_date, entry_category, file_number, subject, officer_assigned, status)
VALUES ('2024-01-01', 'File', 'FN-001', 'Sample entry', 'Officer A', 'Open');
