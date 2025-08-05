const fs = require('fs');
const path = require('path');

class AuditLogger {
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
   * Log audit event
   * @param {object} event - Audit event object
   */
  logEvent(event) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ...event
    };

    const logFile = path.join(this.logDir, `audit-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFileSync(logFile, logLine);
    console.log(`[AUDIT] ${timestamp} - ${event.action} by ${event.user} on ${event.resource}`);
  }

  /**
   * Log user authentication events
   * @param {string} username - Username
   * @param {string} action - Action (login, logout, failed_login)
   * @param {string} ip - IP address
   * @param {object} additionalData - Additional data
   */
  logAuthEvent(username, action, ip, additionalData = {}) {
    this.logEvent({
      category: 'authentication',
      action,
      user: username,
      resource: 'system',
      ip,
      userAgent: additionalData.userAgent,
      success: action !== 'failed_login',
      details: additionalData
    });
  }

  /**
   * Log data access events
   * @param {string} username - Username
   * @param {string} action - Action (view, create, update, delete)
   * @param {string} resource - Resource type (file, letter, entry)
   * @param {string} resourceId - Resource ID
   * @param {object} additionalData - Additional data
   */
  logDataAccessEvent(username, action, resource, resourceId, additionalData = {}) {
    this.logEvent({
      category: 'data_access',
      action,
      user: username,
      resource,
      resourceId,
      details: additionalData
    });
  }

  /**
   * Log system events
   * @param {string} action - Action performed
   * @param {string} component - System component
   * @param {object} additionalData - Additional data
   */
  logSystemEvent(action, component, additionalData = {}) {
    this.logEvent({
      category: 'system',
      action,
      user: 'system',
      resource: component,
      details: additionalData
    });
  }

  /**
   * Log security events
   * @param {string} username - Username (if applicable)
   * @param {string} action - Security action
   * @param {string} resource - Resource affected
   * @param {object} additionalData - Additional data
   */
  logSecurityEvent(username, action, resource, additionalData = {}) {
    this.logEvent({
      category: 'security',
      action,
      user: username || 'unknown',
      resource,
      details: additionalData
    });
  }

  /**
   * Log user management events
   * @param {string} adminUser - Admin username performing action
   * @param {string} action - Action (create_user, update_user, delete_user, change_role)
   * @param {string} targetUser - Target username
   * @param {object} additionalData - Additional data
   */
  logUserManagementEvent(adminUser, action, targetUser, additionalData = {}) {
    this.logEvent({
      category: 'user_management',
      action,
      user: adminUser,
      resource: 'user',
      resourceId: targetUser,
      details: additionalData
    });
  }

  /**
   * Log report generation events
   * @param {string} username - Username
   * @param {string} reportType - Type of report
   * @param {object} filters - Report filters
   * @param {object} additionalData - Additional data
   */
  logReportEvent(username, reportType, filters, additionalData = {}) {
    this.logEvent({
      category: 'reports',
      action: 'generate_report',
      user: username,
      resource: 'report',
      resourceId: reportType,
      details: {
        filters,
        ...additionalData
      }
    });
  }

  /**
   * Log export events
   * @param {string} username - Username
   * @param {string} exportType - Type of export (PDF, CSV, etc.)
   * @param {string} resource - Resource being exported
   * @param {object} additionalData - Additional data
   */
  logExportEvent(username, exportType, resource, additionalData = {}) {
    this.logEvent({
      category: 'exports',
      action: 'export_data',
      user: username,
      resource,
      details: {
        exportType,
        ...additionalData
      }
    });
  }

  /**
   * Get audit logs for a specific date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {object} filters - Additional filters
   * @returns {Array} Array of audit log entries
   */
  getAuditLogs(startDate, endDate, filters = {}) {
    const logs = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all log files in the date range
    const logFiles = fs.readdirSync(this.logDir)
      .filter(file => file.startsWith('audit-'))
      .filter(file => {
        const fileDate = file.replace('audit-', '').replace('.log', '');
        const logDate = new Date(fileDate);
        return logDate >= start && logDate <= end;
      });

    logFiles.forEach(file => {
      const filePath = path.join(this.logDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n');

      lines.forEach(line => {
        try {
          const logEntry = JSON.parse(line);
          
          // Apply filters
          let include = true;
          
          if (filters.user && logEntry.user !== filters.user) {
            include = false;
          }
          
          if (filters.category && logEntry.category !== filters.category) {
            include = false;
          }
          
          if (filters.action && logEntry.action !== filters.action) {
            include = false;
          }
          
          if (filters.resource && logEntry.resource !== filters.resource) {
            include = false;
          }

          if (include) {
            logs.push(logEntry);
          }
        } catch (parseError) {
          console.error('Error parsing audit log entry:', parseError);
        }
      });
    });

    return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get audit statistics
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {object} Audit statistics
   */
  getAuditStats(startDate, endDate) {
    const logs = this.getAuditLogs(startDate, endDate);
    
    const stats = {
      totalEvents: logs.length,
      eventsByCategory: {},
      eventsByUser: {},
      eventsByAction: {},
      eventsByResource: {},
      eventsByDate: {},
      recentEvents: logs.slice(-10)
    };

    logs.forEach(log => {
      // Count by category
      stats.eventsByCategory[log.category] = (stats.eventsByCategory[log.category] || 0) + 1;
      
      // Count by user
      stats.eventsByUser[log.user] = (stats.eventsByUser[log.user] || 0) + 1;
      
      // Count by action
      stats.eventsByAction[log.action] = (stats.eventsByAction[log.action] || 0) + 1;
      
      // Count by resource
      stats.eventsByResource[log.resource] = (stats.eventsByResource[log.resource] || 0) + 1;
      
      // Count by date
      const date = log.timestamp.split('T')[0];
      stats.eventsByDate[date] = (stats.eventsByDate[date] || 0) + 1;
    });

    return stats;
  }

  /**
   * Create audit log entry for database operations
   * @param {string} username - Username
   * @param {string} operation - Database operation (INSERT, UPDATE, DELETE, SELECT)
   * @param {string} table - Database table
   * @param {string} recordId - Record ID (if applicable)
   * @param {object} additionalData - Additional data
   */
  logDatabaseOperation(username, operation, table, recordId, additionalData = {}) {
    this.logEvent({
      category: 'database',
      action: operation.toLowerCase(),
      user: username,
      resource: table,
      resourceId: recordId,
      details: additionalData
    });
  }
}

// Create a singleton instance
const auditLogger = new AuditLogger();

module.exports = auditLogger; 