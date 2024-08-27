const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const dbPath = path.resolve(__dirname, './database/recordsmgmtsys.db');
const app = express();
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/recent-entries', (req, res) => {
    const query = `
        SELECT entry_id, entry_date, file_number, file_subject, officer_assigned, status
        FROM entries_tbl
        ORDER BY entry_date DESC
        LIMIT 6;
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

app.post('/api/update-entry', (req, res) => {
    const { entry_id, file_number, status } = req.body;
    const query = `
        UPDATE entries_tbl
        SET file_number = ?, status = ?
        WHERE entry_id = ?;
    `;
    db.run(query, [file_number, status, entry_id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Entry updated successfully' });
    });
});

app.get('/api/entries', (req, res) => {
    const { category } = req.query;
    const query = `
        SELECT *
        FROM entries_tbl
        WHERE entry_category = ?;
    `;
    db.all(query, [category], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
