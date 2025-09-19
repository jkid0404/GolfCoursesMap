const sql = require('mssql');

module.exports = async function (context, req) {
    // Add CORS headers
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    const courseId = req.params.courseId;

    if (!courseId) {
        context.res.status = 400;
        context.res.body = { error: 'Course ID is required' };
        return;
    }

    // Use connection string if available, otherwise fall back to individual settings
    const connectionString = process.env.SQLAZURECONNSTR_DefaultConnection;
    
    let config;
    if (connectionString) {
        config = connectionString;
    } else {
        config = {
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            server: process.env.SQL_SERVER,
            database: process.env.SQL_DATABASE,
            options: {
                encrypt: true
            }
        };
    }

    try {
        await sql.connect(config);
        
        // Delete the course from the database
        const request = new sql.Request();
        request.input('courseId', sql.Int, parseInt(courseId));
        
        const result = await request.query('DELETE FROM MasterList_USA WHERE ID = @courseId');

        if (result.rowsAffected[0] === 0) {
            context.res.status = 404;
            context.res.body = { error: 'Course not found' };
        } else {
            context.res.status = 200;
            context.res.body = { 
                success: true, 
                message: `Course ${courseId} deleted successfully`,
                rowsAffected: result.rowsAffected[0]
            };
        }
    } catch (err) {
        context.log.error('SQL error:', err);
        context.res.status = 500;
        context.res.body = { error: 'Database error', details: err.message };
    } finally {
        try {
            await sql.close();
        } catch (closeError) {
            context.log.error('Error closing SQL connection:', closeError);
        }
    }
};