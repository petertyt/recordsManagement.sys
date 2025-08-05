const { validatePasswordStrength } = require("./auth");

/**
 * Sanitize input string to prevent XSS and injection attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/['"]/g, "") // Remove quotes to prevent SQL injection
    .replace(/[;]/g, "") // Remove semicolons
    .replace(/[\\]/g, "") // Remove backslashes
    .replace(/\s+/g, " "); // Normalize whitespace
}

/**
 * Sanitize username specifically - less aggressive than general sanitization
 * @param {string} input - Username to sanitize
 * @returns {string} Sanitized username
 */
function sanitizeUsername(input) {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/[;]/g, "") // Remove semicolons
    .replace(/\s+/g, " "); // Normalize whitespace
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if valid date format
 */
function validateDate(date) {
  if (!date) return false;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
}

/**
 * Validate file number format
 * @param {string} fileNumber - File number to validate
 * @returns {object} Validation result
 */
function validateFileNumber(fileNumber) {
  if (!fileNumber || typeof fileNumber !== "string") {
    return { isValid: false, message: "File number is required" };
  }

  const sanitized = sanitizeInput(fileNumber);

  if (sanitized.length < 3) {
    return {
      isValid: false,
      message: "File number must be at least 3 characters long",
    };
  }

  if (sanitized.length > 50) {
    return {
      isValid: false,
      message: "File number must be less than 50 characters",
    };
  }

  return { isValid: true, sanitized };
}

/**
 * Validate entry data
 * @param {object} entryData - Entry data to validate
 * @returns {object} Validation result
 */
function validateEntryData(entryData) {
  const errors = [];
  const sanitizedData = {};

  // Required fields
  const requiredFields = [
    "entry_date",
    "entry_category",
    "file_number",
    "subject",
    "officer_assigned",
    "status",
  ];

  for (const field of requiredFields) {
    if (!entryData[field] || typeof entryData[field] !== "string") {
      errors.push(`${field.replace("_", " ")} is required`);
    } else {
      sanitizedData[field] = sanitizeInput(entryData[field]);

      if (sanitizedData[field].length === 0) {
        errors.push(`${field.replace("_", " ")} cannot be empty`);
      }
    }
  }

  // Validate date
  if (entryData.entry_date && !validateDate(entryData.entry_date)) {
    errors.push("Invalid entry date format. Use YYYY-MM-DD");
  }

  // Validate file number
  const fileNumberValidation = validateFileNumber(entryData.file_number);
  if (!fileNumberValidation.isValid) {
    errors.push(fileNumberValidation.message);
  } else {
    sanitizedData.file_number = fileNumberValidation.sanitized;
  }

  // Optional fields
  const optionalFields = [
    "received_date",
    "recipient",
    "file_type",
    "letter_date",
    "letter_type",
    "folio_number",
  ];

  for (const field of optionalFields) {
    if (entryData[field]) {
      sanitizedData[field] = sanitizeInput(entryData[field]);

      // Validate dates
      if (
        (field === "received_date" || field === "letter_date") &&
        entryData[field]
      ) {
        if (!validateDate(entryData[field])) {
          errors.push(
            `Invalid ${field.replace("_", " ")} format. Use YYYY-MM-DD`
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
}

/**
 * Validate user data
 * @param {object} userData - User data to validate
 * @returns {object} Validation result
 */
function validateUserData(userData, isUpdate = false) {
  const errors = [];
  const sanitizedData = {};

  // Required fields
  if (!userData.username || typeof userData.username !== "string") {
    errors.push("Username is required");
  } else {
    const sanitizedUsername = sanitizeUsername(userData.username);
    if (sanitizedUsername.length < 3) {
      errors.push("Username must be at least 3 characters long");
    } else if (sanitizedUsername.length > 50) {
      errors.push("Username must be less than 50 characters");
    } else {
      sanitizedData.username = sanitizedUsername;
    }
  }

  // Password validation - only required for new users, not for updates
  if (!isUpdate) {
    if (!userData.password || typeof userData.password !== "string") {
      errors.push("Password is required");
    } else {
      const passwordValidation = validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        errors.push(passwordValidation.message);
      }
    }
  } else {
    // For updates, password is optional - only validate if provided
    if (userData.password && typeof userData.password === "string") {
      const passwordValidation = validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        errors.push(passwordValidation.message);
      }
    }
  }

  // Optional fields
  if (userData.email) {
    if (!validateEmail(userData.email)) {
      errors.push("Invalid email format");
    } else {
      sanitizedData.email = sanitizeInput(userData.email);
    }
  }

  if (userData.user_role) {
    const validRoles = ["admin", "user", "manager", "Administrator", "User"];
    const sanitizedRole = sanitizeInput(userData.user_role);
    if (!validRoles.includes(sanitizedRole)) {
      errors.push("Invalid user role");
    } else {
      // Preserve the original role value as stored in the database
      sanitizedData.user_role = sanitizedRole;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
}

/**
 * Validate query parameters for reports
 * @param {object} queryParams - Query parameters to validate
 * @returns {object} Validation result
 */
function validateReportQuery(queryParams) {
  const errors = [];
  const sanitizedParams = {};

  // Date range validation
  if (queryParams.start_date) {
    if (!validateDate(queryParams.start_date)) {
      errors.push("Invalid start date format. Use YYYY-MM-DD");
    } else {
      sanitizedParams.start_date = queryParams.start_date;
    }
  }

  if (queryParams.end_date) {
    if (!validateDate(queryParams.end_date)) {
      errors.push("Invalid end date format. Use YYYY-MM-DD");
    } else {
      sanitizedParams.end_date = queryParams.end_date;
    }
  }

  // Date range logic validation
  if (sanitizedParams.start_date && sanitizedParams.end_date) {
    const startDate = new Date(sanitizedParams.start_date);
    const endDate = new Date(sanitizedParams.end_date);

    if (startDate > endDate) {
      errors.push("Start date cannot be after end date");
    }
  }

  // Optional string parameters
  const optionalStringFields = [
    "officer_assigned",
    "status",
    "file_number",
    "category",
  ];

  for (const field of optionalStringFields) {
    if (queryParams[field]) {
      const sanitized = sanitizeInput(queryParams[field]);
      if (sanitized.length > 0) {
        sanitizedParams[field] = sanitized;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedParams,
  };
}

/**
 * Create Express middleware for input validation
 * @param {function} validationFunction - Validation function to use
 * @returns {function} Express middleware
 */
function createValidationMiddleware(validationFunction) {
  return (req, res, next) => {
    const dataToValidate = req.method === "GET" ? req.query : req.body;
    const validation = validationFunction(dataToValidate);

    if (!validation.isValid) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.errors,
      });
    }

    // Replace request data with sanitized data
    if (req.method === "GET") {
      req.query = { ...req.query, ...validation.sanitizedParams };
    } else {
      req.body = { ...req.body, ...validation.sanitizedData };
    }

    next();
  };
}

module.exports = {
  sanitizeInput,
  sanitizeUsername,
  validateEmail,
  validateDate,
  validateFileNumber,
  validateEntryData,
  validateUserData,
  validateReportQuery,
  createValidationMiddleware,
};
