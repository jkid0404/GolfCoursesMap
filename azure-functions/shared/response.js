// Set CORS headers
function setCorsHeaders(context, methods = ['GET', 'POST', 'OPTIONS']) {
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': methods.join(', '),
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };
}

// Handle preflight OPTIONS request
function handleOptionsRequest(context, req) {
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return true; // Indicates OPTIONS was handled
    }
    return false;
}

// Send error response
function sendErrorResponse(context, statusCode, error, details = null) {
    context.res.status = statusCode;
    context.res.body = details ? { error, details } : { error };
}

// Send success response
function sendSuccessResponse(context, data, statusCode = 200) {
    context.res.status = statusCode;
    context.res.headers = context.res.headers || {};
    context.res.headers['Content-Type'] = 'application/json';
    context.res.body = data;
}

// Log error consistently
function logError(context, operation, error) {
    context.log.error(`${operation} error:`, error);
}

module.exports = {
    setCorsHeaders,
    handleOptionsRequest,
    sendErrorResponse,
    sendSuccessResponse,
    logError
};