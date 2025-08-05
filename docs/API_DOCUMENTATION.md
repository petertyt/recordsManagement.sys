# API Documentation - Records Management System

## 📋 Overview

The Records Management System provides a RESTful API for managing files, letters, and user data. All endpoints return JSON responses and use standard HTTP status codes.

**Base URL**: `http://localhost:49200`

**Content-Type**: `application/json`

## 🔐 Authentication

### POST /api/login

Authenticates user credentials and returns user information.

**Request**:

```json
{
  "username": "string",
  "password": "string"
}
```

**Response (Success - 200)**:

```json
{
  "message": "Login successful",
  "user": {
    "user_id": 1,
    "username": "admin",
    "user_role": "admin",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (Error - 401)**:

```json
{
  "error": "Invalid username or password"
}
```

**Response (Error - 400)**:

```json
{
  "error": "Missing required fields"
}
```

**Response (Error - 500)**:

```json
{
  "error": "Database error message"
}
```

## 📊 Dashboard Endpoints

### GET /api/recent-entries

Retrieves the 6 most recent entries for the dashboard.

**Query Parameters**: None

**Response (Success - 200)**:

```json
{
  "data": [
    {
      "entry_id": 1,
      "entry_date": "2024-01-15",
      "entry_category": "File",
      "file_number": "F001/2024",
      "subject": "Sample file subject",
      "officer_assigned": "CLAO/C1",
      "status": "IN"
    }
  ]
}
```

**Response (Error - 500)**:

```json
{
  "error": "Database error message"
}
```

### GET /api/summations

Retrieves dashboard statistics including total counts.

**Query Parameters**: None

**Response (Success - 200)**:

```json
{
  "total_entries": 150,
  "total_letters": 75,
  "total_files": 75
}
```

**Response (Error - 500)**:

```json
{
  "error": "Database error message"
}
```

## 📁 File Management Endpoints

### GET /api/get-files

Retrieves all files from the database.

**Query Parameters**: None

**Response (Success - 200)**:

```json
{
  "data": [
    {
      "entry_id": 1,
      "entry_date": "2024-01-15",
      "entry_category": "File",
      "file_number": "F001/2024",
      "subject": "Sample file subject",
      "officer_assigned": "CLAO/C1",
      "recieved_date": "2024-01-10",
      "date_sent": "2024-01-20",
      "file_type": "Internal",
      "reciepient": "Department A",
      "description": "Sample file description",
      "status": "IN"
    }
  ]
}
```

### POST /api/add-file

Creates a new file entry.

**Request**:

```json
{
  "entry_date": "2024-01-15",
  "file_number": "F001/2024",
  "subject": "Sample file subject",
  "officer_assigned": "CLAO/C1",
  "status": "IN",
  "date_sent": "2024-01-20",
  "file_type": "Internal",
  "recieved_date": "2024-01-10",
  "reciepient": "Department A",
  "description": "Sample file description"
}
```

**Required Fields**:

- `entry_date`
- `file_number`
- `subject`
- `officer_assigned`
- `status`
- `date_sent`
- `file_type`

**Optional Fields**:

- `recieved_date`
- `reciepient`
- `description`

**Response (Success - 201)**:

```json
{
  "message": "File added successfully",
  "entry_id": 1
}
```

**Response (Error - 400)**:

```json
{
  "error": "Missing required fields"
}
```

**Response (Error - 500)**:

```json
{
  "error": "Database error message"
}
```

### POST /api/update-file

Updates an existing file entry.

**Request**:

```json
{
  "entry_id": 1,
  "entry_date": "2024-01-15",
  "file_number": "F001/2024",
  "subject": "Updated file subject",
  "officer_assigned": "CLAO/C1",
  "status": "OUT",
  "date_sent": "2024-01-20",
  "file_type": "Internal",
  "recieved_date": "2024-01-10",
  "reciepient": "Department A",
  "description": "Updated file description"
}
```

**Required Fields**:

- `entry_id`
- `entry_date`
- `file_number`
- `subject`
- `officer_assigned`
- `status`
- `date_sent`
- `file_type`

**Response (Success - 200)**:

```json
{
  "message": "File updated successfully"
}
```

**Response (Error - 400)**:

```json
{
  "error": "Missing required fields"
}
```

### DELETE /api/delete-file/:entry_id

Deletes a file entry by ID.

**URL Parameters**:

- `entry_id` (number): The ID of the file to delete

**Response (Success - 200)**:

```json
{
  "message": "File deleted successfully"
}
```

**Response (Error - 500)**:

```json
{
  "error": "Error deleting File: database error"
}
```

## 📄 Letter Management Endpoints

### GET /api/get-letters

Retrieves all letters from the database.

**Query Parameters**: None

**Response (Success - 200)**:

```json
{
  "data": [
    {
      "entry_id": 2,
      "entry_date": "2024-01-15",
      "entry_category": "Letter",
      "file_number": "L001/2024",
      "subject": "Sample letter subject",
      "officer_assigned": "CLAO/C1",
      "recieved_date": "2024-01-10",
      "letter_date": "2024-01-12",
      "letter_type": "Incoming",
      "folio_number": "FOL001",
      "description": "Sample letter description",
      "status": "IN"
    }
  ]
}
```

### POST /api/add-letter

Creates a new letter entry.

**Request**:

```json
{
  "entry_date": "2024-01-15",
  "file_number": "L001/2024",
  "subject": "Sample letter subject",
  "officer_assigned": "CLAO/C1",
  "status": "IN",
  "recieved_date": "2024-01-10",
  "letter_date": "2024-01-12",
  "letter_type": "Incoming",
  "folio_number": "FOL001",
  "description": "Sample letter description"
}
```

**Required Fields**:

- `entry_date`
- `file_number`
- `subject`
- `officer_assigned`
- `status`
- `recieved_date`
- `letter_date`
- `letter_type`

**Optional Fields**:

- `folio_number`
- `description`

**Response (Success - 201)**:

```json
{
  "message": "Letter added successfully",
  "entry_id": 2
}
```

### POST /api/update-letter

Updates an existing letter entry.

**Request**:

```json
{
  "entry_id": 2,
  "entry_date": "2024-01-15",
  "file_number": "L001/2024",
  "subject": "Updated letter subject",
  "officer_assigned": "CLAO/C1",
  "status": "OUT",
  "recieved_date": "2024-01-10",
  "letter_date": "2024-01-12",
  "letter_type": "Incoming",
  "folio_number": "FOL001",
  "description": "Updated letter description"
}
```

**Response (Success - 200)**:

```json
{
  "message": "Letter updated successfully"
}
```

### DELETE /api/delete-letter/:entry_id

Deletes a letter entry by ID.

**URL Parameters**:

- `entry_id` (number): The ID of the letter to delete

**Response (Success - 200)**:

```json
{
  "message": "Letter deleted successfully"
}
```

## 📊 Reports Endpoints

### GET /api/make-reports

Generates filtered reports based on query parameters.

**Query Parameters**:

- `start_date` (optional): Start date for filtering (YYYY-MM-DD)
- `end_date` (optional): End date for filtering (YYYY-MM-DD)
- `officer_assigned` (optional): Officer name for filtering
- `status` (optional): Status for filtering (IN, OUT, FILED, PENDING)
- `file_number` (optional): File number for filtering
- `category` (optional): Category for filtering (File, Letter)

**Example Request**:

```
GET /api/make-reports?start_date=2024-01-01&end_date=2024-01-31&officer_assigned=CLAO/C1&status=IN&category=File
```

**Response (Success - 200)**:

```json
{
  "data": [
    {
      "entry_id": 1,
      "entry_date": "2024-01-15",
      "entry_category": "File",
      "file_number": "F001/2024",
      "subject": "Sample file subject",
      "officer_assigned": "CLAO/C1",
      "status": "IN"
    }
  ]
}
```

### GET /api/all-entries

Retrieves all entries for general listing.

**Query Parameters**: None

**Response (Success - 200)**:

```json
{
  "data": [
    {
      "entry_id": 1,
      "entry_date": "2024-01-15",
      "entry_category": "File",
      "file_number": "F001/2024",
      "subject": "Sample file subject",
      "officer_assigned": "CLAO/C1",
      "status": "IN"
    }
  ]
}
```

## 🔧 General Endpoints

### POST /api/update-entry

Updates basic entry information (file number and status).

**Request**:

```json
{
  "entry_id": 1,
  "file_number": "F001/2024",
  "status": "OUT"
}
```

**Required Fields**:

- `entry_id`
- `file_number`
- `status`

**Response (Success - 200)**:

```json
{
  "message": "Entry updated successfully"
}
```

**Response (Error - 404)**:

```json
{
  "error": "Entry not found"
}
```

### DELETE /api/delete-entry/:entry_id

Deletes any entry by ID.

**URL Parameters**:

- `entry_id` (number): The ID of the entry to delete

**Response (Success - 200)**:

```json
{
  "message": "Entry deleted successfully"
}
```

## 📋 Data Models

### Entry Model

```json
{
  "entry_id": "number (auto-increment)",
  "entry_date": "string (YYYY-MM-DD)",
  "entry_category": "string (File|Letter)",
  "file_number": "string",
  "subject": "string",
  "officer_assigned": "string",
  "recieved_date": "string (YYYY-MM-DD) | null",
  "date_sent": "string (YYYY-MM-DD) | null",
  "file_type": "string | null",
  "reciepient": "string | null",
  "description": "string | null",
  "status": "string (IN|OUT|FILED|PENDING)",
  "letter_date": "string (YYYY-MM-DD) | null",
  "letter_type": "string | null",
  "folio_number": "string | null"
}
```

### User Model

```json
{
  "user_id": "number (auto-increment)",
  "username": "string (unique)",
  "password": "string (plain text - needs hashing)",
  "user_role": "string (admin|user|officer)",
  "created_at": "string (ISO datetime)"
}
```

## 🔍 Status Codes

| Code | Description                                      |
| ---- | ------------------------------------------------ |
| 200  | Success                                          |
| 201  | Created                                          |
| 400  | Bad Request - Missing or invalid parameters      |
| 401  | Unauthorized - Invalid credentials               |
| 404  | Not Found - Resource doesn't exist               |
| 500  | Internal Server Error - Database or server error |

## 🚨 Error Handling

### Standard Error Response Format

```json
{
  "error": "Human-readable error message"
}
```

### Common Error Messages

- `"Missing required fields"` - Required parameters not provided
- `"Invalid username or password"` - Authentication failed
- `"Entry not found"` - Resource doesn't exist
- `"Database error message"` - SQLite or connection error

## 🔧 Usage Examples

### JavaScript (Fetch API)

```javascript
// Login
const loginResponse = await fetch("http://localhost:49200/api/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "admin",
    password: "password",
  }),
});

const loginData = await loginResponse.json();

// Get files
const filesResponse = await fetch("http://localhost:49200/api/get-files");
const filesData = await filesResponse.json();

// Add new file
const newFileResponse = await fetch("http://localhost:49200/api/add-file", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    entry_date: "2024-01-15",
    file_number: "F001/2024",
    subject: "Sample file",
    officer_assigned: "CLAO/C1",
    status: "IN",
    date_sent: "2024-01-20",
    file_type: "Internal",
  }),
});

const newFileData = await newFileResponse.json();
```

### jQuery

```javascript
// Login
$.ajax({
  url: "http://localhost:49200/api/login",
  type: "POST",
  contentType: "application/json",
  data: JSON.stringify({
    username: "admin",
    password: "password",
  }),
  success: function (response) {
    console.log("Login successful:", response);
  },
  error: function (xhr, status, error) {
    console.error("Login failed:", error);
  },
});

// Get dashboard statistics
$.ajax({
  url: "http://localhost:49200/api/summations",
  type: "GET",
  success: function (data) {
    $("#entries-count").text(data.total_entries);
    $("#letters-count").text(data.total_letters);
    $("#files-count").text(data.total_files);
  },
  error: function (xhr, status, error) {
    console.error("Error fetching statistics:", error);
  },
});
```

### cURL

```bash
# Login
curl -X POST http://localhost:49200/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get files
curl http://localhost:49200/api/get-files

# Add new file
curl -X POST http://localhost:49200/api/add-file \
  -H "Content-Type: application/json" \
  -d '{
    "entry_date": "2024-01-15",
    "file_number": "F001/2024",
    "subject": "Sample file",
    "officer_assigned": "CLAO/C1",
    "status": "IN",
    "date_sent": "2024-01-20",
    "file_type": "Internal"
  }'

# Generate report
curl "http://localhost:49200/api/make-reports?start_date=2024-01-01&end_date=2024-01-31&status=IN"
```

## 🔒 Security Considerations

### Current Security Issues

1. **Password Storage**: Passwords are stored in plain text
2. **No Session Management**: No proper session handling
3. **No CSRF Protection**: No CSRF tokens implemented
4. **Limited Input Validation**: Basic validation only
5. **No Rate Limiting**: No protection against brute force

### Recommended Security Improvements

1. Implement password hashing (bcrypt)
2. Add proper session management
3. Implement CSRF protection
4. Add comprehensive input validation
5. Implement rate limiting
6. Add audit logging
7. Use HTTPS in production

## 📊 Performance Considerations

### Database Optimization

```sql
-- Recommended indexes for better performance
CREATE INDEX idx_entries_date ON entries_tbl(entry_date);
CREATE INDEX idx_entries_category ON entries_tbl(entry_category);
CREATE INDEX idx_entries_status ON entries_tbl(status);
CREATE INDEX idx_entries_officer ON entries_tbl(officer_assigned);
CREATE INDEX idx_users_username ON users_tbl(username);
```

### Response Time Targets

- **Simple queries**: < 50ms
- **Complex queries**: < 100ms
- **Report generation**: < 200ms
- **Bulk operations**: < 500ms

## 🔄 Versioning

### Current Version

- **API Version**: v1.0
- **Base URL**: `http://localhost:49200`
- **Format**: JSON

### Future Versioning Strategy

- Use URL versioning: `/api/v2/`
- Maintain backward compatibility
- Deprecation notices in headers
- Migration guides for breaking changes

---

_Last Updated: [Current Date]_
_Version: 1.0.0_
