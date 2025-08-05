const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "./recordsmgmtsys.db");
const db = new sqlite3.Database(dbPath);

console.log("Checking database schema after migration...\n");

// Check entries_tbl structure
db.all("PRAGMA table_info(entries_tbl);", [], (err, rows) => {
  if (err) {
    console.error("Error checking entries_tbl:", err.message);
  } else {
    console.log("entries_tbl structure:");
    rows.forEach((row) => {
      console.log(
        `  ${row.name} (${row.type}) ${row.notnull ? "NOT NULL" : ""} ${
          row.pk ? "PRIMARY KEY" : ""
        }`
      );
    });
  }

  // Check users_tbl structure
  db.all("PRAGMA table_info(users_tbl);", [], (err, rows) => {
    if (err) {
      console.error("Error checking users_tbl:", err.message);
    } else {
      console.log("\nusers_tbl structure:");
      rows.forEach((row) => {
        console.log(
          `  ${row.name} (${row.type}) ${row.notnull ? "NOT NULL" : ""} ${
            row.pk ? "PRIMARY KEY" : ""
          }`
        );
      });
    }

    // Check indexes
    db.all("PRAGMA index_list(entries_tbl);", [], (err, rows) => {
      if (err) {
        console.error("Error checking indexes:", err.message);
      } else {
        console.log("\nIndexes on entries_tbl:");
        rows.forEach((row) => {
          console.log(`  ${row.name}`);
        });
      }

      // Check sample data
      db.all("SELECT * FROM entries_tbl LIMIT 1;", [], (err, rows) => {
        if (err) {
          console.error("Error checking sample data:", err.message);
        } else if (rows.length > 0) {
          console.log("\nSample entry data:");
          console.log(JSON.stringify(rows[0], null, 2));
        }

        db.close();
      });
    });
  });
});
