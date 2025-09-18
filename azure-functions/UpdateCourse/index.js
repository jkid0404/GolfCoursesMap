const sql = require('mssql');

module.exports = async function (context, req) {
    // Add CORS headers
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    const courseId = req.params.id;

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
        
        // Update the played status for the course
        // Using a WHERE clause based on row number since CourseID might be the index
        const result = await sql.query`
            UPDATE MasterList_USA 
            SET Played = 1
            WHERE ID = ${parseInt(courseId)}
        `;

        context.res.status = 200;
        context.res.body = { 
            success: true, 
            message: `Course ${courseId} marked as played`,
            rowsAffected: result.rowsAffected[0]
        };
    } catch (err) {
        context.log.error('SQL error:', err);
        context.res.status = 500;
        context.res.body = { error: 'Database error', details: err.message };
    } finally {
        await sql.close();
    }
};