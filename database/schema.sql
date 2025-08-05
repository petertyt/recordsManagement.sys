DROP TABLE IF EXISTS entries_tbl;
DROP TABLE IF EXISTS users_tbl;

CREATE TABLE entries_tbl (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    entry_category TEXT NOT NULL,
    file_number TEXT,
    subject TEXT,
    officer_assigned TEXT,
    date_sent TEXT,
    recieved_date TEXT,
    letter_date TEXT,
    reciepient TEXT,
    letter_type TEXT,
    folio_number TEXT,
    file_type TEXT,
    description TEXT,
    status TEXT
);

CREATE TABLE users_tbl (
    user_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    user_role TEXT NOT NULL,
    user_creation_date TEXT
);
