// Configuration for API base URL shared across client scripts
// Default base URL
const DEFAULT_API_BASE_URL = 'http://localhost:49200';

let apiBaseUrl = DEFAULT_API_BASE_URL;

// Allow override via environment variable
if (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) {
  apiBaseUrl = process.env.API_BASE_URL;
} else if (typeof require === 'function') {
  // Attempt to read from settings.json if available
  try {
    const fs = require('fs');
    const path = require('path');
    const candidatePaths = [
      path.resolve(__dirname, '../../settings.json'),
      path.resolve(__dirname, '../../../settings.json')
    ];

    for (const settingsPath of candidatePaths) {
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.API_BASE_URL) {
          apiBaseUrl = settings.API_BASE_URL;
          break;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load API base URL from settings.json', err);
  }
}

const API_BASE_URL = apiBaseUrl;

// Expose globally for browser scripts
if (typeof window !== 'undefined') {
  window.API_BASE_URL = API_BASE_URL;
}

// Export for CommonJS environments if needed
if (typeof module !== 'undefined') {
  module.exports = { API_BASE_URL };
}

