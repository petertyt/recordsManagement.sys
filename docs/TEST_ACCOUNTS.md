# Test Accounts Documentation

## Overview

This document contains all test accounts available in the Records Management System for development, testing, and demonstration purposes.

## Test Accounts

### Administrator Accounts

| Username    | Password   | Role          | Status | Notes                 |
| ----------- | ---------- | ------------- | ------ | --------------------- |
| `LVD-ADMIN` | `password` | Administrator | Active | Primary admin account |

### User Accounts

| Username       | Password   | Role | Status | Notes                 |
| -------------- | ---------- | ---- | ------ | --------------------- |
| `LVD-PRUDENCE` | `password` | User | Active | Standard user account |
| `LVD-PETER`    | `password` | User | Active | Standard user account |
| `LVD-ESTHER`   | `password` | User | Active | Standard user account |
| `LVD-COURAGE`  | `password` | User | Active | Standard user account |

## Account Details

### LVD-ADMIN (Administrator)

- **Username**: `LVD-ADMIN`
- **Password**: `password`
- **Role**: Administrator
- **Permissions**: Full system access, user management, all CRUD operations
- **Use Case**: System administration, user management, full testing

### LVD-PRUDENCE (User)

- **Username**: `LVD-PRUDENCE`
- **Password**: `password`
- **Role**: User
- **Permissions**: Standard user access, record management
- **Use Case**: Regular user testing, record operations

### LVD-PETER (User)

- **Username**: `LVD-PETER`
- **Password**: `password`
- **Role**: User
- **Permissions**: Standard user access, record management
- **Use Case**: Regular user testing, record operations

### LVD-ESTHER (User)

- **Username**: `LVD-ESTHER`
- **Password**: `password`
- **Role**: User
- **Permissions**: Standard user access, record management
- **Use Case**: Regular user testing, record operations

### LVD-COURAGE (User)

- **Username**: `LVD-COURAGE`
- **Password**: `password`
- **Role**: User
- **Permissions**: Standard user access, record management
- **Use Case**: Regular user testing, record operations

## Security Features

### Password Hashing

- All passwords are stored using bcrypt hashing
- Plain text passwords are automatically hashed on first successful login
- Backward compatibility maintained for existing accounts

### Session Management

- Secure session handling for all authenticated users
- Session timeout and cleanup mechanisms
- Audit logging for all authentication events

## Testing Scenarios

### 1. Authentication Testing

```bash
# Test successful login
Username: LVD-ADMIN
Password: password

# Test invalid credentials
Username: LVD-ADMIN
Password: wrongpassword
```

### 2. Role-Based Access Testing

- **Administrator**: Test full system access, user management
- **User**: Test standard record management operations

### 3. Password Hashing Testing

1. Login with any account using plain text password
2. Check console for "Password hashed for user: [username]" message
3. Logout and login again
4. Verify successful login with hashed password

### 4. Security Testing

- Test invalid username/password combinations
- Test session management
- Test logout functionality
- Test concurrent user sessions

## Database Information

### Users Table Schema

```sql
CREATE TABLE users_tbl (
    user_id INTEGER NOT NULL PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    user_role TEXT NOT NULL,
    user_creation_date TEXT
);
```

### Current Database Status

- **Database File**: `database/recordsmgmtsys.db`
- **Migration Status**: All migrations applied successfully
- **Password Status**: All passwords are hashed using bcrypt
- **Index Status**: All performance indexes created

## Usage Instructions

### For Developers

1. Use these accounts for testing new features
2. Test both administrator and user roles
3. Verify security features work correctly
4. Check audit logs for authentication events

### For Testers

1. Test login functionality with valid credentials
2. Test login with invalid credentials
3. Test role-based access control
4. Test session management
5. Test logout functionality

### For Demonstrations

1. Use `LVD-ADMIN` for full system demonstration
2. Use user accounts for limited functionality demonstration
3. Show different permission levels
4. Demonstrate security features

## Maintenance

### Adding New Test Accounts

1. Add account to database using SQLite
2. Update this documentation
3. Test the new account
4. Verify password hashing works

### Updating Passwords

1. Update password in database
2. Update this documentation
3. Test login functionality
4. Verify password hashing

### Removing Test Accounts

1. Remove from database
2. Update this documentation
3. Test remaining accounts
4. Update any hardcoded references

## Troubleshooting

### Common Issues

1. **Can't Login**: Verify username/password combination
2. **Password Not Working**: Check if password was hashed correctly
3. **Role Issues**: Verify user role in database
4. **Session Issues**: Check session management configuration

### Debug Commands

```bash
# Check database schema
node database/check-schema.js

# Check user accounts
node -e "const sqlite3 = require('sqlite3').verbose(); const path = require('path'); const dbPath = path.resolve('./database/recordsmgmtsys.db'); const db = new sqlite3.Database(dbPath); db.all('SELECT username, user_role FROM users_tbl;', [], (err, rows) => { if (err) { console.error('Error:', err.message); } else { console.log('Available users:'); rows.forEach(row => console.log('Username: ' + row.username + ', Role: ' + row.user_role)); } db.close(); });"

# Check password status
node -e "const sqlite3 = require('sqlite3').verbose(); const path = require('path'); const dbPath = path.resolve('./database/recordsmgmtsys.db'); const db = new sqlite3.Database(dbPath); db.all('SELECT username, password FROM users_tbl LIMIT 2;', [], (err, rows) => { if (err) { console.error('Error:', err.message); } else { console.log('Sample user passwords:'); rows.forEach(row => { const isHashed = row.password.startsWith('$2b$'); console.log('Username: ' + row.username + ', Password: ' + (isHashed ? '[HASHED]' : row.password) + ', IsHashed: ' + isHashed); }); } db.close(); });"
```

## Version History

### v1.0.0 (Current)

- Initial test accounts created
- Password hashing implemented
- Role-based access control implemented
- Session management implemented
- Audit logging implemented

## Notes

- All passwords are set to `password` for easy testing
- In production, use strong, unique passwords
- Regularly rotate test account passwords
- Monitor audit logs for security events
- Keep this documentation updated with any changes
