const { connectToDatabase, closeDatabaseConnection, sql } = require('../shared/database');
const { validateTableName, validateCourseId } = require('../shared/validation');
const { setCorsHeaders, handleOptionsRequest, sendErrorResponse, sendSuccessResponse, logError } = require('../shared/response');
const { getTableName } = require('../shared/sqlUtils');

module.exports = async function (context, req) {
    // Set CORS headers
    setCorsHeaders(context, ['DELETE', 'OPTIONS']);

    // Handle preflight OPTIONS request
    if (handleOptionsRequest(context, req)) {
        return;
    }

    const courseId = req.params.id;
    const tableName = getTableName(req);

    // Validate course ID
    if (!validateCourseId(courseId)) {
        sendErrorResponse(context, 400, 'Invalid course ID');
        return;
    }

    // Validate table name
    if (!validateTableName(tableName)) {
        sendErrorResponse(context, 400, 'Invalid table name format');
        return;
    }

    try {
        await connectToDatabase();
        
        // Delete the course from the database
        const request = new sql.Request();
        request.input('courseId', sql.Int, parseInt(courseId));
        
        const result = await request.query(`DELETE FROM [${tableName}] WHERE ID = @courseId`);

        if (result.rowsAffected[0] === 0) {
            sendErrorResponse(context, 404, 'Course not found');
        } else {
            sendSuccessResponse(context, {
                success: true,
                message: `Course ${courseId} deleted successfully`,
                rowsAffected: result.rowsAffected[0]
            });
        }
    } catch (err) {
        logError(context, 'DeleteCourse SQL', err);
        sendErrorResponse(context, 500, 'Database error', err.message);
    } finally {
        await closeDatabaseConnection();
    }
};