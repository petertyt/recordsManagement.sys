# Records Management System

## Configuration

This project reads runtime settings from environment variables via
`config/settings.js`:

- `PORT` – port number for the Express server (defaults to `49200`).
- `DB_PATH` – path to the SQLite database file (defaults to
  `./database/recordsmgmtsys.db`).

The `npm start` script sets these defaults automatically, but they can be
overridden when launching the application:

```bash
PORT=5000 DB_PATH=/path/to/recordsmgmtsys.db npm start
```

