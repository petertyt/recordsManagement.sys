const path = require('path');

// Application configuration values with sensible defaults
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 49200;
const DB_PATH =
  process.env.DB_PATH ||
  path.resolve(__dirname, '../database/recordsmgmtsys.db');

module.exports = { PORT, DB_PATH };
