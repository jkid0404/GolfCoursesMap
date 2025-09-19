const { connectToDatabase, closeDatabaseConnection, sql } = require('../shared/database');
const { validateTableName } = require('../shared/validation');
const { setCorsHeaders, handleOptionsRequest, sendErrorResponse, sendSuccessResponse, logError } = require('../shared/response');
const { getTableName } = require('../shared/sqlUtils');

module.exports = async function (context, req) {
    // Set CORS headers
    setCorsHeaders(context, ['GET', 'POST', 'OPTIONS']);

    // Handle preflight OPTIONS request
    if (handleOptionsRequest(context, req)) {
        return;
    }

    // Get table name from request
    const tableName = getTableName(req);
    
    // Validate table name to prevent SQL injection
    if (!validateTableName(tableName)) {
        sendErrorResponse(context, 400, 'Invalid table name format');
        return;
    }

    try {
        await connectToDatabase();
        
        // Use parameterized query with dynamic table name (table names cannot be parameterized, but we validated above)
        const query = `SELECT * FROM [${tableName}]`;
        const result = await sql.query(query);
        
        sendSuccessResponse(context, result.recordset);
    } catch (err) {
        logError(context, 'GetCourses SQL', err);
        sendErrorResponse(context, 500, 'Database error', err.message);
    } finally {
        await closeDatabaseConnection();
    }
};
