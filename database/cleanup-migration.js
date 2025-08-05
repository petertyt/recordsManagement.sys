const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, './recordsmgmtsys.db');
const db = new sqlite3.Database(dbPath);

console.log('Cleaning up failed migration...\n');

// Drop backup table if it exists
db.run("DROP TABLE IF EXISTS entries_tbl_backup;", (err) => {
  if (err) {
    console.error('Error dropping backup table:', err.message);
  } else {
    console.log('✓ Dropped entries_tbl_backup table');
  }
  
  // Drop new table if it exists
  db.run("DROP TABLE IF EXISTS entries_tbl_new;", (err) => {
    if (err) {
      console.error('Error dropping new table:', err.message);
    } else {
      console.log('✓ Dropped entries_tbl_new table');
    }
    
    // Check if original table still exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='entries_tbl';", (err, row) => {
      if (err) {
        console.error('Error checking original table:', err.message);
      } else if (row) {
        console.log('✓ Original entries_tbl table exists');
      } else {
        console.error('✗ Original entries_tbl table is missing!');
      }
      
      db.close();
      console.log('\nCleanup completed.');
    });
  });
}); 