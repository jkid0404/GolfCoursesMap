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
    const updates = req.body;

    // Validate that we have updates to make
    if (!updates || Object.keys(updates).length === 0) {
        context.res.status = 400;
        context.res.body = { error: 'No update data provided' };
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
        
        // Build dynamic SET clause based on provided properties
        const allowedFields = ['Course', 'Address', 'City', 'State', 'ZIP', 'Info', 'Access', 'Played', 'Latitude', 'Longitude'];
        const setClause = [];
        const parameters = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                setClause.push(`${key} = @${key}`);
                parameters.push({ name: key, value: value });
            }
        }

        if (setClause.length === 0) {
            context.res.status = 400;
            context.res.body = { error: 'No valid fields to update' };
            return;
        }

        // Create the SQL query
        const query = `UPDATE MasterList_USA SET ${setClause.join(', ')} WHERE ID = @courseId`;
        
        // Create request and add parameters
        const request = new sql.Request();
        request.input('courseId', sql.Int, parseInt(courseId));
        
        parameters.forEach(param => {
            if (param.name === 'Played') {
                request.input(param.name, sql.Int, parseInt(param.value));
            } else {
                request.input(param.name, sql.NVarChar, param.value);
            }
        });

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            context.res.status = 404;
            context.res.body = { error: 'Course not found' };
        } else {
            context.res.status = 200;
            context.res.body = { 
                success: true, 
                message: `Course ${courseId} updated successfully`,
                updatedFields: Object.keys(updates).filter(key => allowedFields.includes(key)),
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