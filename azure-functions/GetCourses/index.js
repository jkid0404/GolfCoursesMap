const { connectToDatabase, closeDatabaseConnection, sql } = require('../shared/database');
const { validateTableName } = require('../shared/validation');
const { setCorsHeaders, handleOptionsRequest, sendErrorResponse, sendSuccessResponse, logError } = require('../shared/response');
const { getTableName, ensureTableExists } = require('../shared/sqlUtils');

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
        
        // Ensure table exists, create if it doesn't
        const tableResult = await ensureTableExists(tableName);
        if (tableResult.created) {
            context.log.info(tableResult.message);
        }
        
        // Use parameterized query with dynamic table name (table names cannot be parameterized, but we validated above)
        const query = `SELECT * FROM [${tableName}]`;
        const result = await sql.query(query);
        
        // Include table creation info in response if table was just created
        const responseData = {
            courses: result.recordset,
            ...(tableResult.created && { 
                tableCreated: true, 
                message: tableResult.message 
            })
        };
        
        sendSuccessResponse(context, responseData);
    } catch (err) {
        logError(context, 'GetCourses SQL', err);
        sendErrorResponse(context, 500, 'Database error', err.message);
    } finally {
        await closeDatabaseConnection();
    }
};
