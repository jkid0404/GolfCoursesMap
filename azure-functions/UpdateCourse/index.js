const { connectToDatabase, closeDatabaseConnection, sql } = require('../shared/database');
const { validateTableName, validateCourseId, validateUpdateFields } = require('../shared/validation');
const { setCorsHeaders, handleOptionsRequest, sendErrorResponse, sendSuccessResponse, logError } = require('../shared/response');
const { getTableName, buildSetClause } = require('../shared/sqlUtils');

module.exports = async function (context, req) {
    // Set CORS headers
    setCorsHeaders(context, ['GET', 'POST', 'PUT', 'OPTIONS']);

    // Handle preflight OPTIONS request
    if (handleOptionsRequest(context, req)) {
        return;
    }

    const courseId = req.params.id;
    const updates = req.body;
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

    // Validate update fields
    const validation = validateUpdateFields(updates);
    if (!validation.isValid) {
        sendErrorResponse(context, 400, 'Validation failed', validation.errors);
        return;
    }

    try {
        await connectToDatabase();
        
        // Build dynamic SET clause based on provided properties
        const allowedFields = ['Course', 'Address', 'City', 'State', 'ZIP', 'Info', 'Access', 'Played', 'Latitude', 'Longitude'];
        const { setClause, parameters } = buildSetClause(validation.validUpdates, allowedFields);

        // Create the SQL query
        const query = `UPDATE [${tableName}] SET ${setClause.join(', ')} WHERE ID = @courseId`;
        
        // Execute the update
        const request = new sql.Request();
        request.input('courseId', sql.Int, parseInt(courseId));
        
        // Add dynamic parameters
        for (const param of parameters) {
            if (param.name == 'Played') {
                request.input(param.name, sql.Int, parseInt(param.value));
            } else if (param.name == 'Latitude' || param.name == 'Longitude') {
                request.input(param.name, sql.Float, parseFloat(param.value));
            } else {
                request.input(param.name, sql.NVarChar, param.value);
            }
        }
        
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            sendErrorResponse(context, 404, 'Course not found');
        } else {
            sendSuccessResponse(context, {
                success: true,
                message: `Course ${courseId} updated successfully`,
                updatedFields: Object.keys(validation.validUpdates),
                rowsAffected: result.rowsAffected[0]
            });
        }
    } catch (err) {
        logError(context, 'UpdateCourse SQL', err);
        sendErrorResponse(context, 500, 'Database error', err.message);
    } finally {
        await closeDatabaseConnection();
    }
};