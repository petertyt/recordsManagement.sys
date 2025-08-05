const fs = require('fs');
const path = require('path');

class ErrorHandler {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log error to file
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @param {object} additionalData - Additional data to log
   */
  logError(error, context = 'Unknown', additionalData = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      context,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      additionalData
    };

    const logFile = path.join(this.logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFileSync(logFile, logLine);
    console.error(`[${timestamp}] Error in ${context}:`, error.message);
  }

  /**
   * Create user-friendly error message
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @returns {string} User-friendly error message
   */
  getUserFriendlyMessage(error, context) {
    const errorMessages = {
      'ValidationError': 'The data you provided is invalid. Please check your input and try again.',
      'DatabaseError': 'There was a problem accessing the database. Please try again later.',
      'AuthenticationError': 'Invalid username or password. Please check your credentials.',
      'AuthorizationError': 'You do not have permission to perform this action.',
      'NetworkError': 'There was a problem connecting to the server. Please check your internet connection.',
      'FileNotFoundError': 'The requested file could not be found.',
      'DuplicateEntryError': 'This record already exists. Please use a different identifier.',
      'TimeoutError': 'The operation took too long to complete. Please try again.',
      'UnknownError': 'An unexpected error occurred. Please try again later.'
    };

    // Map specific error types to user-friendly messages
    if (error.name === 'ValidationError') {
      return errorMessages.ValidationError;
    }

    if (error.message.includes('UNIQUE constraint failed')) {
      return errorMessages.DuplicateEntryError;
    }

    if (error.message.includes('no such table')) {
      return errorMessages.DatabaseError;
    }

    if (error.message.includes('timeout')) {
      return errorMessages.TimeoutError;
    }

    // Default error message
    return errorMessages.UnknownError;
  }

  /**
   * Handle database errors
   * @param {Error} error - Database error
   * @param {string} operation - Database operation being performed
   * @returns {object} Error response object
   */
  handleDatabaseError(error, operation) {
    this.logError(error, `Database: ${operation}`);
    
    const userMessage = this.getUserFriendlyMessage(error, 'database');
    
    return {
      success: false,
      error: userMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  /**
   * Handle validation errors
   * @param {Array} errors - Array of validation errors
   * @param {string} context - Validation context
   * @returns {object} Error response object
   */
  handleValidationError(errors, context) {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.validationErrors = errors;
    
    this.logError(error, `Validation: ${context}`, { errors });
    
    return {
      success: false,
      error: 'Validation failed',
      details: errors
    };
  }

  /**
   * Handle authentication errors
   * @param {Error} error - Authentication error
   * @returns {object} Error response object
   */
  handleAuthenticationError(error) {
    this.logError(error, 'Authentication');
    
    return {
      success: false,
      error: 'Invalid username or password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  /**
   * Handle authorization errors
   * @param {string} requiredRole - Required role for the action
   * @param {string} userRole - User's current role
   * @returns {object} Error response object
   */
  handleAuthorizationError(requiredRole, userRole) {
    const error = new Error(`Insufficient permissions. Required: ${requiredRole}, User: ${userRole}`);
    error.name = 'AuthorizationError';
    
    this.logError(error, 'Authorization', { requiredRole, userRole });
    
    return {
      success: false,
      error: 'You do not have permission to perform this action',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  /**
   * Create Express error handling middleware
   * @returns {function} Express error handling middleware
   */
  createErrorMiddleware() {
    return (error, req, res, next) => {
      // Log the error
      this.logError(error, 'Express Middleware', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Determine error type and create appropriate response
      let statusCode = 500;
      let response = {
        success: false,
        error: this.getUserFriendlyMessage(error, 'express')
      };

      if (error.name === 'ValidationError') {
        statusCode = 400;
        response = this.handleValidationError(error.validationErrors || [], 'express');
      } else if (error.name === 'AuthenticationError') {
        statusCode = 401;
        response = this.handleAuthenticationError(error);
      } else if (error.name === 'AuthorizationError') {
        statusCode = 403;
        response = this.handleAuthorizationError(error.requiredRole, error.userRole);
      } else if (error.name === 'NotFoundError') {
        statusCode = 404;
        response.error = 'The requested resource was not found';
      } else if (error.name === 'DuplicateEntryError') {
        statusCode = 409;
        response.error = 'This record already exists';
      }

      // Add development details if in development mode
      if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
        response.details = error.message;
      }

      res.status(statusCode).json(response);
    };
  }

  /**
   * Create async error wrapper for Express routes
   * @param {function} fn - Async function to wrap
   * @returns {function} Wrapped function with error handling
   */
  wrapAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Get error statistics
   * @returns {object} Error statistics
   */
  getErrorStats() {
    const logFiles = fs.readdirSync(this.logDir).filter(file => file.startsWith('error-'));
    const stats = {
      totalErrors: 0,
      errorsByContext: {},
      errorsByDate: {},
      recentErrors: []
    };

    logFiles.forEach(file => {
      const filePath = path.join(this.logDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n');

      lines.forEach(line => {
        try {
          const logEntry = JSON.parse(line);
          stats.totalErrors++;

          // Count by context
          const context = logEntry.context;
          stats.errorsByContext[context] = (stats.errorsByContext[context] || 0) + 1;

          // Count by date
          const date = logEntry.timestamp.split('T')[0];
          stats.errorsByDate[date] = (stats.errorsByDate[date] || 0) + 1;

          // Recent errors (last 10)
          if (stats.recentErrors.length < 10) {
            stats.recentErrors.push({
              timestamp: logEntry.timestamp,
              context: logEntry.context,
              message: logEntry.error.message
            });
          }
        } catch (parseError) {
          console.error('Error parsing log entry:', parseError);
        }
      });
    });

    return stats;
  }
}

// Create a singleton instance
const errorHandler = new ErrorHandler();

module.exports = errorHandler; 