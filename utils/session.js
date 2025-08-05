const crypto = require('crypto');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
  }

  /**
   * Generate a secure session ID
   * @returns {string} Secure session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new session for a user
   * @param {object} userData - User data to store in session
   * @returns {object} Session object with id and user data
   */
  createSession(userData) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      userData: {
        username: userData.username,
        role: userData.role || 'user',
        email: userData.email
      },
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isActive: true
    };

    this.sessions.set(sessionId, session);
    
    // Clean up expired sessions
    this.cleanupExpiredSessions();
    
    return session;
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID to retrieve
   * @returns {object|null} Session object or null if not found/expired
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return null;
    }

    // Check if session has expired
    const now = Date.now();
    if (now - session.lastActivity > this.sessionTimeout) {
      this.destroySession(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    this.sessions.set(sessionId, session);
    
    return session;
  }

  /**
   * Update session activity
   * @param {string} sessionId - Session ID to update
   * @returns {boolean} True if session was updated successfully
   */
  updateSessionActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }

    session.lastActivity = Date.now();
    this.sessions.set(sessionId, session);
    return true;
  }

  /**
   * Destroy a session
   * @param {string} sessionId - Session ID to destroy
   * @returns {boolean} True if session was destroyed
   */
  destroySession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Get all active sessions (for admin purposes)
   * @returns {Array} Array of active sessions
   */
  getActiveSessions() {
    this.cleanupExpiredSessions();
    
    const activeSessions = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.isActive) {
        activeSessions.push({
          id: sessionId,
          username: session.userData.username,
          role: session.userData.role,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        });
      }
    }
    
    return activeSessions;
  }

  /**
   * Get session statistics
   * @returns {object} Session statistics
   */
  getSessionStats() {
    this.cleanupExpiredSessions();
    
    const totalSessions = this.sessions.size;
    const activeSessions = this.getActiveSessions().length;
    
    return {
      total: totalSessions,
      active: activeSessions,
      expired: totalSessions - activeSessions
    };
  }
}

// Create a singleton instance
const sessionManager = new SessionManager();

module.exports = sessionManager; 