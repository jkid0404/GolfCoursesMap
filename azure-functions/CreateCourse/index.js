const sql = require('mssql');

module.exports = async function (context, req) {
    // Add CORS headers
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    const newCourse = req.body;

    // Validate required fields
    const requiredFields = ['Course', 'Address', 'City', 'State', 'ZIP', 'Latitude', 'Longitude'];
    for (const field of requiredFields) {
        if (newCourse[field] === undefined || newCourse[field] === null || newCourse[field] === '') {
            context.res.status = 400;
            context.res.body = { error: `${field} is required` };
            return;
        }
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
        
        // Insert new course into the database
        const request = new sql.Request();
        request.input('Course', sql.NVarChar, newCourse.Course);
        request.input('Address', sql.NVarChar, newCourse.Address);
        request.input('City', sql.NVarChar, newCourse.City);
        request.input('State', sql.NVarChar, newCourse.State);
        request.input('ZIP', sql.NVarChar, newCourse.ZIP);
        request.input('Info', sql.NVarChar, newCourse.Info || '');
        request.input('Access', sql.NVarChar, newCourse.Access || 'Public');
        request.input('Played', sql.Int, parseInt(newCourse.Played) || 0);
        request.input('Latitude', sql.Float, parseFloat(newCourse.Latitude));
        request.input('Longitude', sql.Float, parseFloat(newCourse.Longitude));
        
        const result = await request.query(`
            INSERT INTO MasterList_USA (Course, Address, City, State, ZIP, Info, Access, Played, Latitude, Longitude)
            OUTPUT INSERTED.ID
            VALUES (@Course, @Address, @City, @State, @ZIP, @Info, @Access, @Played, @Latitude, @Longitude)
        `);

        const newId = result.recordset[0].ID;

        context.res.status = 201;
        context.res.body = { 
            success: true, 
            message: 'Course created successfully',
            courseId: newId,
            course: {
                ID: newId,
                ...newCourse
            }
        };
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