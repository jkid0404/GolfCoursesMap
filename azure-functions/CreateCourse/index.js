const { connectToDatabase, closeDatabaseConnection, sql } = require('../shared/database');
const { validateTableName, validateCourseFields } = require('../shared/validation');
const { setCorsHeaders, handleOptionsRequest, sendErrorResponse, sendSuccessResponse, logError } = require('../shared/response');
const { getTableName, prepareCourseParameters } = require('../shared/sqlUtils');

module.exports = async function (context, req) {
    // Set CORS headers
    setCorsHeaders(context, ['POST', 'OPTIONS']);

    // Handle preflight OPTIONS request
    if (handleOptionsRequest(context, req)) {
        return;
    }

    const newCourse = req.body;
    const tableName = getTableName(req);

    // Validate table name
    if (!validateTableName(tableName)) {
        sendErrorResponse(context, 400, 'Invalid table name format');
        return;
    }

    // Validate required fields
    const validation = validateCourseFields(newCourse);
    if (!validation.isValid) {
        sendErrorResponse(context, 400, 'Validation failed', validation.errors);
        return;
    }

    try {
        await connectToDatabase();
        
        // Insert new course into the database
        const request = new sql.Request();
        prepareCourseParameters(request, newCourse);
        
        const result = await request.query(`
            INSERT INTO [${tableName}] (Course, Address, City, State, ZIP, Info, Access, Played, Latitude, Longitude)
            OUTPUT INSERTED.ID
            VALUES (@Course, @Address, @City, @State, @ZIP, @Info, @Access, @Played, @Latitude, @Longitude)
        `);

        const newId = result.recordset[0].ID;

        sendSuccessResponse(context, {
            success: true,
            message: 'Course created successfully',
            courseId: newId,
            course: {
                ID: newId,
                ...newCourse
            }
        }, 201);
    } catch (err) {
        logError(context, 'CreateCourse SQL', err);
        sendErrorResponse(context, 500, 'Database error', err.message);
    } finally {
        await closeDatabaseConnection();
    }
};