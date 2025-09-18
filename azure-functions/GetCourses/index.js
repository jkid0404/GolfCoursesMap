const sql = require('mssql');

module.exports = async function (context, req) {
    // Add CORS headers for local development
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    // Update with your Azure SQL connection string
    const config = {
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        server: process.env.SQL_SERVER, // e.g. 'your-server.database.windows.net'
        database: process.env.SQL_DATABASE,
        options: {
            encrypt: true
        }
    };

    try {
        await sql.connect(config);
        const result = await sql.query('SELECT * FROM MasterList_USA');
        context.res.status = 200;
        context.res.headers['Content-Type'] = 'application/json';
        context.res.body = result.recordset;
    } catch (err) {
        context.log.error('SQL error:', err);
        context.res = {
            status: 500,
            body: { error: 'Database error', details: err.message }
        };
    }
};
