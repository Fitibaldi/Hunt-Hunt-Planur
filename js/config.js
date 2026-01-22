// API Configuration
// This file defines the base URL for all API calls

// Automatically detect the API base URL
// If accessing from another machine, this will use the correct IP address
const API_BASE_URL = window.location.origin;

// Export for use in other modules
window.API_CONFIG = {
    BASE_URL: API_BASE_URL,
    
    // Helper function to build API URLs
    getApiUrl: function(endpoint) {
        // Remove leading slash if present to avoid double slashes
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        return `${this.BASE_URL}/${cleanEndpoint}`;
    }
};

console.log('API Base URL configured:', API_BASE_URL);
