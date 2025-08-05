# Records Management System

## Database Utilities

### Initialize

Run `npm run db:init` to create `database/recordsmgmtsys.db` if it does not exist. The script executes `database/init.sql` to build required tables.

### Backup

`npm run db:backup` copies the active database into the `backups/` folder using the pattern `recordsmgmtsys-YYYYMMDD-HHmm.db` and keeps only the five most recent backups. 

To schedule recurring backups with [node-cron](https://www.npmjs.com/package/node-cron), run:

```
npm run db:backup -- --schedule
```

The schedule defaults to daily at midnight. Customize the timing by setting the `DB_BACKUP_SCHEDULE` environment variable with a cron expression.

### Restore

Restore from a backup by providing the file name:

```
npm run db:restore -- <backup-file>
```

The argument may be an absolute path or a file within the `backups/` directory.

## Notes

You can alternatively use your operating system's scheduler (e.g. cron, Task Scheduler) to run the backup script at desired intervals.
