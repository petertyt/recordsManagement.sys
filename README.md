# Records Management System

## Role-based Access Manual Checks

To verify that role-based restrictions work:

1. **API protection**
   - Start the server: `node server.js`.
   - As a non-admin user: `curl -i -H "x-user-role:user" -H "Content-Type: application/json" -d '{}' http://localhost:49200/api/add-file`.
     The request should return `403 Forbidden`.
   - As an admin: `curl -i -H "x-user-role:admin" -H "Content-Type: application/json" -d '{}' http://localhost:49200/api/add-file`.

2. **UI visibility**
   - Launch the application and log in as a user with a role other than `admin`.
   - Menu items such as **Report Management** and buttons like **Add New File/Letter** should be hidden.

