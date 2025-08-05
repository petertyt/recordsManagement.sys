# Records Management System

## Migration

Legacy installations may use the misspelled columns `reciepient` and `recieved_date` in the `entries_tbl` table.
Run the migration script to rename them to `recipient` and `received_date`:

```
node database/migrations/rename_recipient_columns.js
```

Make sure to back up your database before running the script. The application accepts either the old or new field names in request payloads during the transition period.

