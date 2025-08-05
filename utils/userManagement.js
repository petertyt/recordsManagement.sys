const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class UserManagement {
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath);
  }

  // Session Management
  async createSession(userId, ipAddress, userAgent) {
    const sessionId = crypto.randomUUID();
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO user_sessions (session_id, user_id, session_token, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sessionId, userId, sessionToken, ipAddress, userAgent, expiresAt],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ sessionId, sessionToken, expiresAt });
          }
        }
      );
    });
  }

  async validateSession(sessionToken) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT us.*, u.username, u.user_role, u.is_active 
         FROM user_sessions us 
         JOIN users_tbl u ON us.user_id = u.user_id 
         WHERE us.session_token = ? AND us.is_active = 1 AND us.expires_at > datetime('now')`,
        [sessionToken],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  async invalidateSession(sessionToken) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE user_sessions SET is_active = 0 WHERE session_token = ?",
        [sessionToken],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async cleanupExpiredSessions() {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE user_sessions SET is_active = 0 WHERE expires_at < datetime("now")',
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  // Activity Logging
  async logActivity(
    userId,
    activityType,
    activityDescription,
    ipAddress,
    userAgent
  ) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO user_activity_log (user_id, activity_type, activity_description, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, activityType, activityDescription, ipAddress, userAgent],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  async getActivityLog(userId = null, limit = 100) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT ual.*, u.username, u.user_role
        FROM user_activity_log ual
        LEFT JOIN users_tbl u ON ual.user_id = u.user_id
        ORDER BY ual.created_at DESC
        LIMIT ?
      `;
      let params = [limit];

      if (userId) {
        query = query.replace("ORDER BY", "WHERE ual.user_id = ? ORDER BY");
        params = [userId, limit];
      }

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Role-Based Access Control
  async checkPermission(userRole, resource, action) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT is_allowed FROM user_permissions 
         WHERE role_name = ? AND resource_name = ? AND action_name = ?`,
        [userRole, resource, action],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.is_allowed === 1 : false);
          }
        }
      );
    });
  }

  async getUserPermissions(userRole) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT resource_name, action_name FROM user_permissions 
         WHERE role_name = ? AND is_allowed = 1`,
        [userRole],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const permissions = {};
            rows.forEach((row) => {
              if (!permissions[row.resource_name]) {
                permissions[row.resource_name] = [];
              }
              permissions[row.resource_name].push(row.action_name);
            });
            resolve(permissions);
          }
        }
      );
    });
  }

  // User Account Management
  async updateLastLogin(userId, ipAddress) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users_tbl SET last_login_date = datetime("now") WHERE user_id = ?',
        [userId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async incrementLoginAttempts(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE users_tbl SET login_attempts = login_attempts + 1 WHERE user_id = ?",
        [userId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async resetLoginAttempts(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE users_tbl SET login_attempts = 0, locked_until = NULL WHERE user_id = ?",
        [userId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async lockAccount(userId, lockDuration = 30) {
    // 30 minutes
    const lockedUntil = new Date(
      Date.now() + lockDuration * 60 * 1000
    ).toISOString();
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE users_tbl SET locked_until = ? WHERE user_id = ?",
        [lockedUntil, userId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async isAccountLocked(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT locked_until FROM users_tbl WHERE user_id = ?",
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (!row || !row.locked_until) {
              resolve(false);
            } else {
              const lockedUntil = new Date(row.locked_until);
              const now = new Date();
              resolve(lockedUntil > now);
            }
          }
        }
      );
    });
  }

  // User Statistics
  async getUserStats() {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT COUNT(*) as total_users FROM users_tbl",
        (err, totalRow) => {
          if (err) {
            reject(err);
          } else {
            this.db.get(
              'SELECT COUNT(*) as admin_users FROM users_tbl WHERE user_role = "Administrator"',
              (err, adminRow) => {
                if (err) {
                  reject(err);
                } else {
                  this.db.get(
                    'SELECT COUNT(*) as regular_users FROM users_tbl WHERE user_role = "User"',
                    (err, regularRow) => {
                      if (err) {
                        reject(err);
                      } else {
                        this.db.get(
                          "SELECT COUNT(*) as active_users FROM users_tbl WHERE is_active = 1",
                          (err, activeRow) => {
                            if (err) {
                              reject(err);
                            } else {
                              resolve({
                                total_users: totalRow.total_users,
                                admin_users: adminRow.admin_users,
                                regular_users: regularRow.regular_users,
                                active_users: activeRow.active_users,
                              });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    });
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = UserManagement;
