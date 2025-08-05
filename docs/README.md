# Records Management System - Documentation

## 📚 Documentation Overview

Welcome to the comprehensive documentation for the Records Management System. This documentation provides everything you need to understand, develop, deploy, and maintain the system.

## 📋 Quick Start

### For Users

1. **Installation**: Download the latest release from GitHub
2. **Setup**: Run the installer and follow the setup wizard
3. **Login**: Use the default credentials (admin/admin123)
4. **Usage**: Start managing your files and letters

### For Developers

1. **Setup**: Follow the [Development Guide](./DEVELOPMENT_GUIDE.md)
2. **Architecture**: Review the [Technical Specifications](./TECHNICAL_SPECS.md)
3. **API**: Check the [API Documentation](./API_DOCUMENTATION.md)
4. **Database**: Understand the [Database Schema](./DATABASE_SCHEMA.md)

## 📖 Documentation Structure

### Core Documentation

| Document                                            | Description                                    | Audience             |
| --------------------------------------------------- | ---------------------------------------------- | -------------------- |
| [📋 Project Overview](./PROJECT_OVERVIEW.md)        | High-level system overview and architecture    | All users            |
| [🏗️ Technical Specifications](./TECHNICAL_SPECS.md) | Detailed technical architecture and components | Developers           |
| [🔌 API Documentation](./API_DOCUMENTATION.md)      | Complete API reference with examples           | Developers           |
| [🗄️ Database Schema](./DATABASE_SCHEMA.md)          | Database structure and relationships           | Developers           |
| [🎨 Design System](./DESIGN_SYSTEM.md)              | UI/UX guidelines and component library         | Designers/Developers |
| [🛠️ Development Guide](./DEVELOPMENT_GUIDE.md)      | Development setup and best practices           | Developers           |

### Additional Resources

| Resource                                     | Description                            | Audience   |
| -------------------------------------------- | -------------------------------------- | ---------- |
| [🔒 Security Guide](./SECURITY_GUIDE.md)     | Security guidelines and best practices | Developers |
| [🚀 Deployment Guide](./DEPLOYMENT_GUIDE.md) | Production deployment instructions     | DevOps     |
| [🐛 Troubleshooting](./TROUBLESHOOTING.md)   | Common issues and solutions            | All users  |

## 🎯 System Overview

The Records Management System is a desktop application built with Electron that provides comprehensive file and letter management capabilities for office environments.

### Key Features

- ✅ **Authentication System**: Secure user login and role management
- ✅ **Dashboard**: Real-time statistics and recent entries overview
- ✅ **File Management**: Complete CRUD operations for files
- ✅ **Letter Management**: Complete CRUD operations for letters
- ✅ **Reports System**: Filtered report generation and PDF export
- ✅ **Database**: SQLite-based data storage with backup capabilities

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Desktop Framework**: Electron
- **UI Framework**: Bootstrap 5.3.3
- **Template Engine**: EJS
- **Build Tool**: Electron Forge

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v16.0.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: v2.30.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/petertyt/recordsManagement.sys.git

# Navigate to project directory
cd recordsManagement.sys

# Install dependencies
npm install

# Start development server
npm start
```

### Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

## 📊 System Architecture

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

## 🔧 Development

### Project Structure

```
recordsManagement.sys/
├── src/                          # Source files
│   ├── splash-page/              # Splash screen & login
│   ├── index.ejs                # Main application
│   └── partials-public/         # Component styles
├── views/                        # EJS templates
│   ├── pages/                   # Page templates
│   ├── partials/                # Reusable components
│   └── errors/                  # Error pages
├── public/                       # Static assets
├── database/                     # Database files
├── docs/                         # Documentation
├── main.js                       # Electron main process
├── server.js                     # Express server
└── package.json                  # Dependencies & scripts
```

### Available Scripts

```bash
npm start          # Start development server
npm run package    # Package application
npm run make       # Build for distribution
npm run build      # Webpack build
npm run analyze    # Bundle analysis
```

## 📈 Current Status

### ✅ Working Features

- Authentication system
- Dashboard with statistics
- File management (CRUD)
- Letter management (CRUD)
- Reports generation
- PDF export functionality
- Database operations

### ❌ Known Issues

- Passwords stored in plain text
- Limited input validation
- No session timeout
- Missing user management features
- Global search not implemented
- Notification system incomplete

### 🔄 In Progress

- Security enhancements
- User management completion
- Search functionality
- UI/UX improvements

## 🎨 Design System

The system uses a comprehensive design system with:

### Color Palette

- **Primary**: #142332 (Dark Blue)
- **Success**: #28a745 (Green)
- **Error**: #dc3545 (Red)
- **Warning**: #fd7e14 (Orange)
- **Info**: #6f42c1 (Purple)

### Typography

- **Font Family**: Poppins (Primary)
- **Font Sizes**: 12px to 36px scale
- **Font Weights**: 300-800 range

### Components

- Bootstrap-based components
- Custom CSS for branding
- Responsive design principles

## 🔌 API Reference

### Base URL

```
http://localhost:49200
```

### Key Endpoints

- `POST /api/login` - User authentication
- `GET /api/recent-entries` - Recent entries
- `GET /api/summations` - Dashboard statistics
- `GET /api/get-files` - Retrieve all files
- `POST /api/add-file` - Create new file
- `GET /api/get-letters` - Retrieve all letters
- `POST /api/add-letter` - Create new letter
- `GET /api/make-reports` - Generate reports

For complete API documentation, see [API Documentation](./API_DOCUMENTATION.md).

## 🗄️ Database Schema

### Main Tables

- **entries_tbl**: Core records table for files and letters
- **users_tbl**: User authentication and role management

### Key Fields

- `entry_id`: Primary key (auto-increment)
- `entry_date`: Date when entry was created
- `entry_category`: Type of entry (File/Letter)
- `file_number`: Unique file/letter number
- `subject`: Subject/title of the entry
- `officer_assigned`: Officer responsible
- `status`: Current status (IN/OUT/FILED/PENDING)

For complete database documentation, see [Database Schema](./DATABASE_SCHEMA.md).

## 🔒 Security Considerations

### Current Security Model

- Username/password authentication
- Basic session management
- Parameterized queries (SQL injection protection)
- Limited input validation

### Security Improvements Needed

- Password hashing (bcrypt)
- Comprehensive input validation
- Session timeout implementation
- CSRF protection
- Rate limiting
- Audit logging

## 📊 Performance Metrics

### Current Performance

- **Database**: SQLite (fast for small-medium datasets)
- **UI**: Bootstrap (optimized for desktop)
- **Memory**: Electron overhead (~50-100MB)
- **Startup**: ~3-5 seconds

### Optimization Opportunities

- Database indexing
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies

## 🚀 Deployment

### Build Configuration

- **Target Platforms**: Windows, macOS, Linux
- **Build Tool**: Electron Forge
- **Auto-update**: GitHub releases
- **Distribution**: NSIS installer (Windows)

### Production Considerations

- Database path handling for packaged app
- User data storage in app data directory
- Auto-update functionality
- Error logging and monitoring

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards

- Follow the coding standards in [Development Guide](./DEVELOPMENT_GUIDE.md)
- Use semantic commit messages
- Include proper documentation
- Add tests for new features

### Pull Request Process

1. Ensure code follows style guidelines
2. All tests pass
3. No console errors
4. Documentation updated
5. No security vulnerabilities

## 📞 Support

### Getting Help

- **Documentation**: Check the relevant documentation files
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

### Common Issues

- Database connection problems
- API endpoint errors
- UI rendering issues
- Build failures

For troubleshooting, see [Troubleshooting Guide](./TROUBLESHOOTING.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/petertyt/recordsManagement.sys/blob/main/LICENSE) file for details.

## 🙏 Acknowledgments

- **Author**: Peter Quayetey
- **Framework**: Electron
- **UI Framework**: Bootstrap
- **Database**: SQLite
- **Build Tool**: Electron Forge

## 📈 Roadmap

### Phase 1: Critical Fixes (2-3 weeks)

- Security enhancements
- Bug fixes
- Data integrity improvements

### Phase 2: Core Features (3-4 weeks)

- Complete user management
- Enhanced search functionality
- Improved CRUD operations

### Phase 3: Advanced Features (4-5 weeks)

- Notification system
- Advanced reporting
- Workflow management

### Phase 4: UI/UX Overhaul (3-4 weeks)

- Modern design system
- Responsive design
- Enhanced user experience

### Phase 5: Performance & Scalability (2-3 weeks)

- Performance optimization
- Advanced features
- Cloud integration

---

## 📚 Quick Reference

### Essential Commands

```bash
# Development
npm start                    # Start development server
npm run package             # Package application
npm run make               # Build for distribution

# Database
sqlite3 database/recordsmgmtsys.db  # Access database
.schema                    # View database schema
.tables                    # List all tables

# Git
git status                 # Check repository status
git add .                  # Stage all changes
git commit -m "message"    # Commit changes
git push origin main       # Push to remote
```

### Default Configuration

```javascript
// Server Configuration
const PORT = process.env.PORT || 49200;

// Database Configuration
const dbPath = path.resolve(__dirname, "./database/recordsmgmtsys.db");

// Default User
const defaultUser = {
  username: "admin",
  password: "admin123",
  role: "admin",
};
```

### API Base URL

```
http://localhost:49200/api
```

---

_Last Updated: [Current Date]_
_Version: 1.0.0_

For the most up-to-date information, please refer to the individual documentation files in the `docs/` directory.
