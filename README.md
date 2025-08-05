# Records Management System

A comprehensive desktop application for managing records, documents, and administrative data built with Electron, Node.js, and SQLite.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Documentation](#documentation)
- [Development](#development)
- [Security](#security)
- [Contributing](#contributing)

## 🎯 Overview

The Records Management System is a desktop application designed to streamline document management, record keeping, and administrative processes. Built with Electron for cross-platform compatibility, it provides a secure, user-friendly interface for managing records with role-based access control.

## ✨ Features

### Core Features

- **Document Management**: Add, edit, delete, and search records
- **User Authentication**: Secure login with password hashing
- **Role-Based Access**: Administrator and User roles with different permissions
- **Advanced Search**: Filter records by multiple criteria
- **Reporting**: Generate reports and export data
- **Audit Logging**: Track all system activities

### Security Features

- **Password Hashing**: Bcrypt encryption for all passwords
- **Session Management**: Secure session handling
- **Input Validation**: Comprehensive data sanitization
- **Audit Trail**: Complete activity logging
- **Error Handling**: Centralized error management

### Technical Features

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Local Database**: SQLite for data persistence
- **Auto-Updates**: Built-in update mechanism
- **PDF Export**: Generate reports in PDF format
- **Responsive UI**: Modern Bootstrap-based interface

## 🛠 Technology Stack

### Frontend

- **Electron**: Desktop application framework
- **Bootstrap 5.3.3**: UI framework
- **jQuery**: DOM manipulation and AJAX
- **DataTables.net**: Advanced table functionality
- **EJS**: Template engine

### Backend

- **Node.js**: Runtime environment
- **Express.js**: Web server and API
- **SQLite3**: Local database
- **bcrypt**: Password hashing

### Development Tools

- **Electron Forge**: Build and packaging
- **electron-updater**: Auto-update functionality
- **Puppeteer**: PDF generation

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd recordsManagement.sys
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run database migrations**

   ```bash
   npm run migrate
   ```

4. **Start the application**
   ```bash
   npm start
   ```

## 📖 Usage

### Starting the Application

```bash
npm start
```

### Building for Distribution

```bash
npm run make
```

### Running Migrations

```bash
npm run migrate
npm run migrate:status
```

## 🧪 Testing

### Test Accounts

The system includes pre-configured test accounts for development and testing. See [Test Accounts Documentation](docs/TEST_ACCOUNTS.md) for detailed information.

### Quick Test Login

- **Administrator**: `LVD-ADMIN` / `password`
- **User**: `LVD-PRUDENCE` / `password`

### Testing Scenarios

1. **Authentication Testing**: Test login with valid/invalid credentials
2. **Role-Based Access**: Test different permission levels
3. **Password Hashing**: Verify bcrypt implementation
4. **Session Management**: Test session handling
5. **Security Features**: Test input validation and audit logging

## 📚 Documentation

### Core Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Technical Specifications](docs/TECHNICAL_SPECS.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Design System](docs/DESIGN_SYSTEM.md)

### Development Documentation

- [Development Guidelines](docs/DEVELOPMENT_GUIDELINES.md)
- [Security Implementation](docs/SECURITY_IMPLEMENTATION.md)
- [Testing Procedures](docs/TESTING_PROCEDURES.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

### User Documentation

- [User Manual](docs/USER_MANUAL.md)
- [Test Accounts](docs/TEST_ACCOUNTS.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

## 🔧 Development

### Project Structure

```
recordsManagement.sys/
├── src/                    # Source files
│   ├── splash-page/       # Login and splash screen
│   └── main-app/          # Main application
├── views/                 # EJS templates
├── database/              # Database files and migrations
├── utils/                 # Utility functions
├── docs/                  # Documentation
├── assets/                # Static assets
└── config/                # Configuration files
```

### Key Files

- `main.js`: Electron main process
- `server.js`: Express server and API
- `package.json`: Project configuration
- `database/migrate.js`: Database migration system

### Development Commands

```bash
# Start development server
npm start

# Run database migrations
npm run migrate

# Check migration status
npm run migrate:status

# Build for distribution
npm run make

# Package application
npm run package
```

## 🔒 Security

### Implemented Security Features

- **Password Hashing**: All passwords encrypted with bcrypt
- **Input Validation**: Comprehensive data sanitization
- **Session Management**: Secure session handling
- **Audit Logging**: Complete activity tracking
- **Error Handling**: Centralized error management
- **SQL Injection Protection**: Parameterized queries

### Security Best Practices

- Regular password updates
- Input validation on all forms
- Audit log monitoring
- Error message sanitization
- Session timeout configuration

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards

- Follow existing code style
- Add appropriate comments
- Update documentation
- Include tests for new features

### Reporting Issues

- Use descriptive issue titles
- Include steps to reproduce
- Provide system information
- Attach relevant logs

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Getting Help

- Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- Review the [User Manual](docs/USER_MANUAL.md)
- Consult the [API Documentation](docs/API_DOCUMENTATION.md)

### Common Issues

- **Can't Login**: Check [Test Accounts](docs/TEST_ACCOUNTS.md)
- **Database Errors**: Run `npm run migrate`
- **Build Issues**: Check Node.js version and dependencies

## 📊 Project Status

### Current Version: v1.0.0

- ✅ Core functionality implemented
- ✅ Security features implemented
- ✅ Database migrations system
- ✅ Comprehensive documentation
- 🔄 UI/UX improvements in progress
- 🔄 Advanced features in development

### Recent Updates

- Implemented password hashing with bcrypt
- Added comprehensive audit logging
- Created database migration system
- Enhanced security with input validation
- Added session management
- Improved error handling

---

**Note**: This is a development version. For production use, ensure all security features are properly configured and tested.
