# Development Guide - Records Management System

## 📋 Overview

This guide provides comprehensive instructions for setting up, developing, and maintaining the Records Management System. It covers development environment setup, coding standards, best practices, and troubleshooting.

## 🛠️ Development Environment Setup

### Prerequisites

#### Required Software

- **Node.js**: v16.0.0 or higher
- **npm**: v8.0.0 or higher (comes with Node.js)
- **Git**: v2.30.0 or higher
- **Code Editor**: VS Code (recommended) or any modern editor

#### Optional Software

- **SQLite Browser**: For database inspection
- **Postman**: For API testing
- **Chrome DevTools**: For debugging

### Installation Steps

#### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/petertyt/recordsManagement.sys.git

# Navigate to project directory
cd recordsManagement.sys

# Check current branch
git branch
```

#### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

#### 3. Verify Setup

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if all dependencies are installed
npm audit
```

### Development Scripts

#### Available Scripts

```bash
# Start development server
npm start

# Package application
npm run package

# Build for distribution
npm run make

# Webpack build
npm run build

# Bundle analysis
npm run analyze
```

#### Development Workflow

```bash
# 1. Start development server
npm start

# 2. Make changes to code
# 3. Test changes in the application
# 4. Commit changes
git add .
git commit -m "Description of changes"

# 5. Push changes
git push origin main
```

## 🏗️ Project Structure

### Directory Organization

```
recordsManagement.sys/
├── src/                          # Source files
│   ├── splash-page/              # Splash screen & login
│   │   ├── splash.html          # Login interface
│   │   ├── css/                 # Splash styles
│   │   ├── js/                  # Splash logic
│   │   └── assets/              # Splash assets
│   ├── index.ejs                # Main application
│   └── partials-public/         # Component styles
├── views/                        # EJS templates
│   ├── pages/                   # Page templates
│   │   ├── dashboard.ejs        # Dashboard view
│   │   ├── file-management.ejs  # File management
│   │   ├── letter-management.ejs # Letter management
│   │   ├── reports.ejs          # Reports view
│   │   ├── entries.ejs          # Entries view
│   │   └── users.ejs            # Users view
│   ├── partials/                # Reusable components
│   └── errors/                  # Error pages
├── public/                       # Static assets
│   └── index/                   # Main app assets
│       ├── css/                 # Stylesheets
│       ├── js/                  # JavaScript
│       └── fonts/               # Custom fonts
├── database/                     # Database files
│   └── recordsmgmtsys.db        # SQLite database
├── assets/                       # Application assets
├── config/                       # Configuration files
├── docs/                         # Documentation
├── main.js                       # Electron main process
├── server.js                     # Express server
├── preload.js                    # Electron preload
└── package.json                  # Dependencies & scripts
```

### File Naming Conventions

#### JavaScript Files

- **Main process**: `main.js`
- **Server**: `server.js`
- **Preload**: `preload.js`
- **Component renderers**: `{component}-renderer.js`
- **Utilities**: `utils.js`, `helpers.js`

#### CSS Files

- **Main styles**: `styles.css`
- **Component styles**: `{component}-styles.css`
- **Splash styles**: `splash-styles.css`

#### Template Files

- **Main template**: `index.ejs`
- **Page templates**: `{page-name}.ejs`
- **Partials**: `_partial.ejs`

## 📝 Coding Standards

### JavaScript Standards

#### General Rules

```javascript
// Use ES6+ features
const { app, BrowserWindow } = require("electron");
const path = require("path");

// Use arrow functions for callbacks
app.whenReady().then(() => {
  createWindow();
});

// Use template literals
const dbPath = path.join(__dirname, "./database/recordsmgmtsys.db");

// Use destructuring
const { username, password } = req.body;

// Use async/await for promises
async function fetchData() {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
```

#### Function Naming

```javascript
// Use camelCase for functions
function createMainWindow() {}
function handleLoginAttempt() {}
function validateUserInput() {}

// Use descriptive names
function fetchRecentEntries() {}
function updateFileStatus() {}
function generateReport() {}
```

#### Variable Naming

```javascript
// Use camelCase for variables
const userName = "admin";
const fileNumber = "F001/2024";
const entryDate = "2024-01-15";

// Use UPPER_CASE for constants
const API_BASE_URL = "http://localhost:49200";
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;
```

#### Error Handling

```javascript
// Use try-catch blocks
try {
  const result = await databaseOperation();
  return result;
} catch (error) {
  console.error("Database operation failed:", error);
  throw new Error("Failed to perform database operation");
}

// Use proper error messages
if (!username || !password) {
  return res.status(400).json({
    error: "Missing required fields: username and password",
  });
}
```

### CSS Standards

#### Naming Convention (BEM)

```css
/* Block */
.card {
}

/* Element */
.card__header {
}
.card__body {
}
.card__footer {
}

/* Modifier */
.card--elevated {
}
.card--interactive {
}
.card--success {
}
```

#### Organization

```css
/* 1. Reset/Normalize */
/* 2. Base styles */
/* 3. Layout */
/* 4. Components */
/* 5. Utilities */
/* 6. Responsive */

/* Use CSS custom properties */
:root {
  --primary-color: #142332;
  --secondary-color: #28a745;
  --spacing-unit: 1rem;
}

/* Use consistent spacing */
.component {
  padding: var(--spacing-unit);
  margin-bottom: calc(var(--spacing-unit) * 2);
}
```

### HTML/EJS Standards

#### Semantic HTML

```html
<!-- Use semantic elements -->
<header>
  <nav>
    <ul>
      <li><a href="#dashboard">Dashboard</a></li>
    </ul>
  </nav>
</header>

<main>
  <section class="dashboard">
    <h1>Dashboard</h1>
    <article class="stats-card">
      <!-- Content -->
    </article>
  </section>
</main>

<footer>
  <p>&copy; 2024 Records Management System</p>
</footer>
```

#### Accessibility

```html
<!-- Use proper ARIA attributes -->
<button aria-label="Close modal" class="btn-close">
  <span aria-hidden="true">&times;</span>
</button>

<!-- Use proper form labels -->
<label for="username">Username</label>
<input type="text" id="username" name="username" required />

<!-- Use proper table structure -->
<table>
  <caption>
    Recent Entries
  </caption>
  <thead>
    <tr>
      <th scope="col">ID</th>
      <th scope="col">Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>2024-01-15</td>
    </tr>
  </tbody>
</table>
```

## 🔧 Development Workflow

### Feature Development

#### 1. Create Feature Branch

```bash
# Create and switch to feature branch
git checkout -b feature/new-feature

# Verify current branch
git branch
```

#### 2. Develop Feature

```bash
# Make changes to code
# Test changes locally
npm start

# Stage changes
git add .

# Commit changes with descriptive message
git commit -m "feat: add new file management feature

- Add file upload functionality
- Implement drag-and-drop interface
- Add file type validation
- Update database schema for file storage"
```

#### 3. Push and Create Pull Request

```bash
# Push feature branch
git push origin feature/new-feature

# Create pull request on GitHub
# Wait for code review
# Address feedback
# Merge when approved
```

### Bug Fixes

#### 1. Create Bug Fix Branch

```bash
# Create bug fix branch
git checkout -b fix/bug-description

# Or use issue number
git checkout -b fix/issue-123
```

#### 2. Fix and Test

```bash
# Make minimal changes to fix the bug
# Test thoroughly
npm start

# Commit fix
git commit -m "fix: resolve login authentication issue

- Fix password validation logic
- Add proper error handling
- Update authentication flow"
```

### Code Review Process

#### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] No console errors
- [ ] Documentation updated
- [ ] No security vulnerabilities

#### Review Checklist

- [ ] Code is readable and well-documented
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] Accessibility requirements met

## 🧪 Testing

### Manual Testing

#### Core Functionality

```bash
# Test authentication
1. Start application
2. Try invalid credentials
3. Try valid credentials
4. Test logout functionality

# Test file management
1. Add new file
2. Edit existing file
3. Delete file
4. Search files
5. Filter files

# Test letter management
1. Add new letter
2. Edit existing letter
3. Delete letter
4. Search letters
5. Filter letters

# Test reports
1. Generate basic report
2. Apply filters
3. Export to PDF
4. Test date ranges
```

#### Cross-Platform Testing

```bash
# Test on different operating systems
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+)

# Test different screen resolutions
- 1920x1080 (Full HD)
- 1366x768 (HD)
- 2560x1440 (2K)
- 3840x2160 (4K)
```

### Automated Testing (Future)

#### Unit Tests

```javascript
// Example test structure
describe("File Management", () => {
  test("should add new file", async () => {
    const fileData = {
      entry_date: "2024-01-15",
      file_number: "F001/2024",
      subject: "Test File",
      officer_assigned: "CLAO/C1",
      status: "IN",
    };

    const response = await addFile(fileData);
    expect(response.status).toBe(201);
    expect(response.data.entry_id).toBeDefined();
  });
});
```

#### Integration Tests

```javascript
// Example integration test
describe("API Integration", () => {
  test("should authenticate user", async () => {
    const credentials = {
      username: "admin",
      password: "admin123",
    };

    const response = await login(credentials);
    expect(response.status).toBe(200);
    expect(response.data.user).toBeDefined();
  });
});
```

## 🔍 Debugging

### Development Tools

#### VS Code Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/main.js",
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

#### Console Logging

```javascript
// Use structured logging
console.log("User login attempt:", {
  username: username,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
});

// Use different log levels
console.error("Database connection failed:", error);
console.warn("Deprecated function called");
console.info("Application started successfully");
console.debug("Debug information:", debugData);
```

### Common Issues

#### Database Connection Issues

```javascript
// Check database path
console.log("Database path:", dbPath);

// Check if database exists
const fs = require("fs");
if (!fs.existsSync(dbPath)) {
  console.error("Database file not found:", dbPath);
}

// Check database permissions
try {
  fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
} catch (error) {
  console.error("Database permission error:", error);
}
```

#### API Connection Issues

```javascript
// Check server status
fetch("http://localhost:49200/api/health")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .then((data) => console.log("Server is running:", data))
  .catch((error) => console.error("Server connection failed:", error));
```

## 📚 Documentation

### Code Documentation

#### JSDoc Comments

```javascript
/**
 * Authenticates user credentials against the database
 * @param {string} username - The username to authenticate
 * @param {string} password - The password to authenticate
 * @returns {Promise<Object>} Authentication result with user data
 * @throws {Error} When authentication fails
 */
async function authenticateUser(username, password) {
  // Implementation
}

/**
 * Creates a new file entry in the database
 * @param {Object} fileData - The file data to insert
 * @param {string} fileData.entry_date - Entry date (YYYY-MM-DD)
 * @param {string} fileData.file_number - Unique file number
 * @param {string} fileData.subject - File subject
 * @param {string} fileData.officer_assigned - Assigned officer
 * @param {string} fileData.status - File status
 * @returns {Promise<Object>} Created file entry with ID
 */
async function createFile(fileData) {
  // Implementation
}
```

#### README Updates

```markdown
# Feature Name

## Description

Brief description of the feature

## Usage

How to use the feature

## API Changes

Any API changes or new endpoints

## Database Changes

Any database schema changes

## Testing

How to test the feature
```

## 🔒 Security Best Practices

### Input Validation

```javascript
// Validate user input
function validateUserInput(data) {
  const errors = [];

  if (!data.username || typeof data.username !== "string") {
    errors.push("Username is required and must be a string");
  }

  if (!data.password || typeof data.password !== "string") {
    errors.push("Password is required and must be a string");
  }

  if (data.username.length < 3) {
    errors.push("Username must be at least 3 characters");
  }

  if (data.password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  return errors;
}
```

### SQL Injection Prevention

```javascript
// Use parameterized queries
const query = "SELECT * FROM users_tbl WHERE username = ? AND password = ?";
db.get(query, [username, password], (err, row) => {
  // Handle result
});

// Don't use string concatenation
// ❌ Bad
const query = `SELECT * FROM users_tbl WHERE username = '${username}'`;

// ✅ Good
const query = "SELECT * FROM users_tbl WHERE username = ?";
```

### Password Security

```javascript
// Use bcrypt for password hashing
const bcrypt = require("bcrypt");

// Hash password
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verify password
const isMatch = await bcrypt.compare(password, hashedPassword);
```

## 📦 Build and Deployment

### Development Build

```bash
# Start development server
npm start

# Hot reload enabled
# Development database
# Debug logging
# Source maps
```

### Production Build

```bash
# Build for production
npm run make

# This will create:
# - Windows: .exe installer
# - macOS: .dmg package
# - Linux: AppImage
```

### Distribution

```bash
# Package for distribution
npm run package

# Create installer
npm run make

# The built files will be in:
# - dist/ (packaged app)
# - out/ (installers)
```

## 🚀 Performance Optimization

### Code Splitting

```javascript
// Use dynamic imports for large modules
const heavyModule = await import("./heavy-module.js");

// Lazy load components
const LazyComponent = React.lazy(() => import("./LazyComponent"));
```

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_entries_date ON entries_tbl(entry_date);
CREATE INDEX idx_entries_status ON entries_tbl(status);

-- Use LIMIT for large result sets
SELECT * FROM entries_tbl ORDER BY entry_date DESC LIMIT 50;
```

### Memory Management

```javascript
// Clean up event listeners
element.removeEventListener("click", handler);

// Clear intervals and timeouts
clearInterval(intervalId);
clearTimeout(timeoutId);

// Dispose of resources
window.removeEventListener("resize", handleResize);
```

## 🔄 Version Control

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Bug fixes
git checkout -b fix/bug-description
# Make changes
git add .
git commit -m "fix: resolve bug description"
git push origin fix/bug-description

# Hot fixes
git checkout -b hotfix/critical-fix
# Make changes
git add .
git commit -m "hotfix: critical security fix"
git push origin hotfix/critical-fix
```

### Commit Message Format

```bash
# Format: type(scope): description
feat(auth): add two-factor authentication
fix(api): resolve database connection timeout
docs(readme): update installation instructions
style(css): format code according to style guide
refactor(utils): extract common validation functions
test(api): add unit tests for user endpoints
chore(deps): update dependencies to latest versions
```

---

_Last Updated: [Current Date]_
_Version: 1.0.0_
