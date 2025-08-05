# Technical Specifications - Records Management System

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Application                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐              │
│  │   Main Process  │    │  Renderer Process │              │
│  │   (main.js)     │◄──►│   (index.ejs)   │              │
│  └─────────────────┘    └─────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    Express Server                         │
│  ┌─────────────────┐    ┌─────────────────┐              │
│  │   API Routes    │◄──►│   Middleware    │              │
│  └─────────────────┘    └─────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    SQLite Database                        │
│  ┌─────────────────┐    ┌─────────────────┐              │
│  │   entries_tbl   │    │   users_tbl     │              │
│  └─────────────────┘    └─────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Process Communication

- **IPC (Inter-Process Communication)**: Main ↔ Renderer
- **HTTP REST API**: Renderer ↔ Express Server
- **SQLite**: Express Server ↔ Database

## 🔧 Core Components

### 1. Electron Main Process (`main.js`)

#### Responsibilities

- Application lifecycle management
- Window creation and management
- IPC event handling
- Database initialization
- Express server startup

#### Key Functions

```javascript
// Window Management
function createSplashWindow()     // Login window
function createMainWindow()       // Main application window

// IPC Handlers
ipcMain.on('login-attempt')      // Handle login
ipcMain.on('login-success')      // Handle successful login

// Database Setup
// - Development vs Production path handling
// - Database file copying for packaged app
```

#### Configuration

```javascript
// Splash Window
{
  width: 900,
  height: 600,
  frame: false,
  transparent: true,
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: true
  }
}

// Main Window
{
  width: 1920,
  height: 1080,
  frame: true,
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false
  },
  autoHideMenuBar: true
}
```

### 2. Express Server (`server.js` & `main.js`)

#### Server Configuration

```javascript
const app = express();
const PORT = process.env.PORT || 49200;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
```

#### API Route Structure

```javascript
// Authentication
POST /api/login

// Dashboard
GET /api/recent-entries
GET /api/summations

// File Management
GET /api/get-files
POST /api/add-file
POST /api/update-file
DELETE /api/delete-file/:id

// Letter Management
GET /api/get-letters
POST /api/add-letter
POST /api/update-letter
DELETE /api/delete-letter/:id

// Reports
GET /api/make-reports
GET /api/all-entries

// General
POST /api/update-entry
DELETE /api/delete-entry/:id
```

### 3. Database Layer

#### SQLite Configuration

```javascript
// Development Mode
dbPath = path.resolve(__dirname, "./database/recordsmgmtsys.db");

// Production Mode
dbPath = path.join(app.getPath("userData"), "recordsmgmtsys.db");
```

#### Database Schema

```sql
-- Core Records Table
CREATE TABLE entries_tbl (
    entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    entry_category TEXT NOT NULL CHECK(entry_category IN ('File', 'Letter')),
    file_number TEXT NOT NULL,
    subject TEXT NOT NULL,
    officer_assigned TEXT NOT NULL,
    recieved_date TEXT,           -- Note: Misspelled
    date_sent TEXT,
    file_type TEXT,
    reciepient TEXT,              -- Note: Misspelled
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('IN', 'OUT', 'FILED', 'PENDING')),
    letter_date TEXT,             -- Letter-specific
    letter_type TEXT,             -- Letter-specific
    folio_number TEXT             -- Letter-specific
);

-- User Authentication Table
CREATE TABLE users_tbl (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,       -- Currently plain text
    user_role TEXT DEFAULT 'user' CHECK(user_role IN ('admin', 'user', 'officer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Frontend Architecture

#### Template Engine (EJS)

```ejs
<!-- Main Application -->
src/index.ejs

<!-- Page Templates -->
views/pages/dashboard.ejs
views/pages/file-management.ejs
views/pages/letter-management.ejs
views/pages/reports.ejs
views/pages/entries.ejs
views/pages/users.ejs
```

#### JavaScript Architecture

```javascript
// Main Renderer
public / index / js / renderer.js;

// Component-specific Renderers
src / partials - public / dashboard / js / dashboard - renderer.js;
src / partials - public / file - management / js / files - renderer.js;
src / partials - public / letter - management / js / letters - renderer.js;
src / partials - public / reports / js / reports - renderer.js;
src / partials - public / entries / js / entries - renderer.js;

// Splash Screen
src / splash - page / js / splash - renderer.js;
```

#### CSS Architecture

```css
/* Main Styles */
public/index/css/styles.css

/* Component Styles */
src/partials-public/dashboard/css/dashboard-styles.css
src/partials-public/file-management/css/files-styles.css
src/partials-public/letter-management/css/letters-styles.css
src/partials-public/reports/css/report-styles.css
src/partials-public/entries/css/entries-styles.css

/* Splash Styles */
src/splash-page/css/splash-styles.css
```

## 🔌 API Specifications

### Authentication Endpoints

#### POST /api/login

**Purpose**: Authenticate user credentials

```javascript
// Request
{
  "username": "string",
  "password": "string"
}

// Response (Success)
{
  "message": "Login successful",
  "user": {
    "user_id": "number",
    "username": "string",
    "user_role": "string"
  }
}

// Response (Error)
{
  "error": "Invalid username or password"
}
```

### Dashboard Endpoints

#### GET /api/recent-entries

**Purpose**: Get recent entries for dashboard

```javascript
// Response
{
  "data": [
    {
      "entry_id": "number",
      "entry_date": "string",
      "entry_category": "string",
      "file_number": "string",
      "subject": "string",
      "officer_assigned": "string",
      "status": "string"
    }
  ]
}
```

#### GET /api/summations

**Purpose**: Get dashboard statistics

```javascript
// Response
{
  "total_entries": "number",
  "total_letters": "number",
  "total_files": "number"
}
```

### File Management Endpoints

#### GET /api/get-files

**Purpose**: Retrieve all files

```javascript
// Response
{
  "data": [
    {
      "entry_id": "number",
      "entry_date": "string",
      "entry_category": "File",
      "file_number": "string",
      "subject": "string",
      "officer_assigned": "string",
      "recieved_date": "string",
      "date_sent": "string",
      "file_type": "string",
      "reciepient": "string",
      "description": "string",
      "status": "string"
    }
  ]
}
```

#### POST /api/add-file

**Purpose**: Create new file

```javascript
// Request
{
  "entry_date": "string (required)",
  "file_number": "string (required)",
  "subject": "string (required)",
  "officer_assigned": "string (required)",
  "status": "string (required)",
  "date_sent": "string (required)",
  "file_type": "string (required)",
  "recieved_date": "string (optional)",
  "reciepient": "string (optional)",
  "description": "string (optional)"
}

// Response (Success)
{
  "message": "File added successfully",
  "entry_id": "number"
}

// Response (Error)
{
  "error": "Missing required fields"
}
```

### Letter Management Endpoints

#### GET /api/get-letters

**Purpose**: Retrieve all letters

```javascript
// Response
{
  "data": [
    {
      "entry_id": "number",
      "entry_date": "string",
      "entry_category": "Letter",
      "file_number": "string",
      "subject": "string",
      "officer_assigned": "string",
      "recieved_date": "string",
      "letter_date": "string",
      "letter_type": "string",
      "folio_number": "string",
      "description": "string",
      "status": "string"
    }
  ]
}
```

#### POST /api/add-letter

**Purpose**: Create new letter

```javascript
// Request
{
  "entry_date": "string (required)",
  "file_number": "string (required)",
  "subject": "string (required)",
  "officer_assigned": "string (required)",
  "status": "string (required)",
  "recieved_date": "string (required)",
  "letter_date": "string (required)",
  "letter_type": "string (required)",
  "folio_number": "string (optional)",
  "description": "string (optional)"
}

// Response (Success)
{
  "message": "Letter added successfully",
  "entry_id": "number"
}
```

### Reports Endpoints

#### GET /api/make-reports

**Purpose**: Generate filtered reports

```javascript
// Query Parameters
{
  "start_date": "string (optional)",
  "end_date": "string (optional)",
  "officer_assigned": "string (optional)",
  "status": "string (optional)",
  "file_number": "string (optional)",
  "category": "string (optional)"
}

// Response
{
  "data": [
    {
      "entry_id": "number",
      "entry_date": "string",
      "entry_category": "string",
      "file_number": "string",
      "subject": "string",
      "officer_assigned": "string",
      "status": "string"
    }
  ]
}
```

## 🎨 UI/UX Specifications

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Top Navigation Bar                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────┐  │
│  │                 │    │                             │  │
│  │   Sidebar       │    │        Main Content         │  │
│  │   Navigation    │    │                             │  │
│  │                 │    │                             │  │
│  │   - Dashboard   │    │   - Dynamic Content        │  │
│  │   - Files       │    │   - Data Tables            │  │
│  │   - Letters     │    │   - Forms                  │  │
│  │   - Reports     │    │   - Modals                 │  │
│  │   - Users       │    │                             │  │
│  │                 │    │                             │  │
│  └─────────────────┘    └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Navigation Sidebar

- **Width**: 300px
- **Background**: rgba(20, 35, 50, 0.1)
- **Border**: 2px solid rgba(20, 35, 50, 0.1)
- **Padding**: 20px 15px

#### Top Navigation Bar

- **Height**: 80px
- **Background**: White
- **Border**: 1px solid rgba(20, 35, 50, 0.1)
- **Components**: Title, Search Bar, Action Icons

#### Main Content Area

- **Background**: White
- **Padding**: Variable based on content
- **Scroll**: Vertical only

### Responsive Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 640px) {
  /* Small devices */
}
@media (min-width: 768px) {
  /* Medium devices */
}
@media (min-width: 1024px) {
  /* Large devices */
}
@media (min-width: 1280px) {
  /* Extra large devices */
}
```

## 🔒 Security Specifications

### Current Security Model

```javascript
// Authentication
- Username/password validation
- Session management (basic)
- Role-based access (planned)

// Data Protection
- Parameterized queries (implemented)
- Input validation (limited)
- CSRF protection (not implemented)
```

### Security Requirements

```javascript
// Required Implementations
1. Password hashing (bcrypt)
2. Input sanitization
3. Session timeout
4. CSRF tokens
5. Rate limiting
6. Audit logging
```

## 📊 Performance Specifications

### Database Performance

```sql
-- Required Indexes
CREATE INDEX idx_entries_date ON entries_tbl(entry_date);
CREATE INDEX idx_entries_category ON entries_tbl(entry_category);
CREATE INDEX idx_entries_status ON entries_tbl(status);
CREATE INDEX idx_entries_officer ON entries_tbl(officer_assigned);
CREATE INDEX idx_users_username ON users_tbl(username);
```

### Application Performance

```javascript
// Memory Usage
- Electron base: ~50-100MB
- Application: ~20-50MB
- Database: ~5-10MB

// Startup Time
- Development: 3-5 seconds
- Production: 2-3 seconds

// Response Time
- API calls: <100ms
- Database queries: <50ms
- UI updates: <16ms (60fps)
```

## 🛠️ Development Specifications

### Code Standards

```javascript
// JavaScript
- ES6+ syntax
- Async/await for promises
- Error handling with try/catch
- JSDoc comments for functions

// CSS
- BEM methodology
- CSS custom properties
- Mobile-first responsive design
- Accessibility compliance

// HTML
- Semantic HTML5
- ARIA attributes
- SEO optimization
```

### Testing Requirements

```javascript
// Unit Tests
- API endpoint testing
- Database operation testing
- Component testing

// Integration Tests
- End-to-end workflows
- Cross-browser compatibility
- Performance testing

// Security Tests
- Authentication testing
- Input validation testing
- SQL injection testing
```

## 📦 Build Specifications

### Development Build

```bash
npm start
# - Hot reload enabled
# - Development database
# - Debug logging
# - Source maps
```

### Production Build

```bash
npm run make
# - Code minification
# - Asset optimization
# - Database packaging
# - Auto-update configuration
```

### Distribution

```javascript
// Windows
- NSIS installer
- Auto-update via GitHub
- Desktop shortcuts
- Start menu integration

// macOS
- DMG package
- Code signing
- Gatekeeper compliance

// Linux
- AppImage format
- Desktop integration
- Package manager support
```

---

_Last Updated: [Current Date]_
_Version: 1.0.0_
