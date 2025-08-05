# Records Management System

## Database Initialization

The application uses a SQLite database located at `database/recordsmgmtsys.db`.
Run the following command to create the required tables:

```bash
npm run init-db
```

## Schema Migrations

When the database schema changes:

1. Create a new SQL migration file in a separate directory (e.g., `config/migrations`).
2. Run the migration against the existing database using the `sqlite3` CLI or a Node script.
3. Update `config/init-database.js` so fresh installations include the new schema.
4. Commit both the migration file and any related code changes.
