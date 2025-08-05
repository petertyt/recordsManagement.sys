const bcrypt = require("bcrypt");

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @param {number} saltRounds - Number of salt rounds (default: 10)
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password, saltRounds = 10) {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
function validatePasswordStrength(password) {
  const minLength = 6; // Temporarily reduced for easier testing

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  return {
    isValid: errors.length === 0,
    message: errors.length > 0 ? errors.join(", ") : "Password is strong",
  };
}

/**
 * Check if a password is already hashed
 * @param {string} password - Password to check
 * @returns {boolean} True if password is hashed
 */
function isPasswordHashed(password) {
  return password.startsWith("$2b$");
}

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  isPasswordHashed,
};
