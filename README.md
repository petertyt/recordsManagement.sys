# Records Management System

## Port Conflict Handling

The application attempts to start its Express server on the port defined by the `PORT` environment variable (default `49200`).
If the port is already in use, the server logs a friendly message and automatically retries on the next port number until an
available port is found.
