const fs = require('fs');
const path = require('path');

class ResponseLogger {
    constructor(source = 'unknown') {
        this.source = source;
        this.responsesDir = path.join(__dirname, 'responses');

        // Create responses directory if it doesn't exist
        if (!fs.existsSync(this.responsesDir)) {
            fs.mkdirSync(this.responsesDir, { recursive: true });
        }

        // Create source-specific subdirectory
        this.sourceDir = path.join(this.responsesDir, source.toLowerCase());
        if (!fs.existsSync(this.sourceDir)) {
            fs.mkdirSync(this.sourceDir, { recursive: true });
        }
    }

    /**
     * Log API request and response to file
     * @param {string} endpoint - The API endpoint name (e.g., 'search', 'menu', 'cart')
     * @param {object} requestData - The request data (params, body, etc.)
     * @param {object} responseData - The response data
     * @param {number} statusCode - HTTP status code
     * @param {string} method - HTTP method (GET, POST, etc.)
     */
    log(endpoint, requestData, responseData, statusCode = 200, method = 'GET') {
        // Response logging is disabled
        return null;

        // try {
        //     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        //     const fileName = `${endpoint}_${timestamp}.json`;
        //     const filePath = path.join(this.sourceDir, fileName);

        //     const dataToSave = {
        //         source: this.source,
        //         endpoint: endpoint,
        //         method: method,
        //         timestamp: new Date().toISOString(),
        //         status_code: statusCode,
        //         request: requestData,
        //         response: responseData
        //     };

        //     fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf8');
        //     console.log(`💾 [${this.source}] Response logged: ${fileName}`);

        //     return fileName;
        // } catch (error) {
        //     console.error(`❌ [${this.source}] Error logging response:`, error.message);
        //     return null;
        // }
    }

    /**
     * Log error
     * @param {string} endpoint - The API endpoint name
     * @param {object} requestData - The request data
     * @param {Error} error - The error object
     */
    logError(endpoint, requestData, error) {
        // Response logging is disabled
        return null;

        // try {
        //     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        //     const fileName = `${endpoint}_ERROR_${timestamp}.json`;
        //     const filePath = path.join(this.sourceDir, fileName);

        //     const dataToSave = {
        //         source: this.source,
        //         endpoint: endpoint,
        //         timestamp: new Date().toISOString(),
        //         error: true,
        //         request: requestData,
        //         error_message: error.message,
        //         error_stack: error.stack,
        //         error_response: error.response?.data || null,
        //         error_status: error.response?.status || null
        //     };

        //     fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf8');
        //     console.log(`💾 [${this.source}] Error logged: ${fileName}`);

        //     return fileName;
        // } catch (logError) {
        //     console.error(`❌ [${this.source}] Error logging error:`, logError.message);
        //     return null;
        // }
    }
}

module.exports = ResponseLogger;

