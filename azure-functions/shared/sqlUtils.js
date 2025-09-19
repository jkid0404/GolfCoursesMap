const { sql } = require('./database');

// Build dynamic SET clause for UPDATE queries
function buildSetClause(updates, allowedFields) {
    const setClause = [];
    const parameters = [];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            setClause.push(`${key} = @${key}`);
            parameters.push({ name: key, value: value });
        }
    }

    return { setClause, parameters };
}

// Execute parameterized query with error handling
async function executeQuery(query, parameters = []) {
    const request = new sql.Request();
    
    // Add parameters to request
    for (const param of parameters) {
        request.input(param.name, param.type || sql.NVarChar, param.value);
    }
    
    return await request.query(query);
}

// Get table name from request (query or body)
function getTableName(req, defaultTable = 'MasterList_USA') {
    return req.query.tableName || req.body?.tableName || defaultTable;
}

// Prepare course parameters for SQL request
function prepareCourseParameters(request, course) {
    request.input('Course', sql.NVarChar, course.Course);
    request.input('Address', sql.NVarChar, course.Address);
    request.input('City', sql.NVarChar, course.City);
    request.input('State', sql.NVarChar, course.State);
    request.input('ZIP', sql.NVarChar, course.ZIP);
    request.input('Info', sql.NVarChar, course.Info || '');
    request.input('Access', sql.NVarChar, course.Access || 'Public');
    request.input('Played', sql.Int, parseInt(course.Played) || 0);
    request.input('Latitude', sql.Float, parseFloat(course.Latitude));
    request.input('Longitude', sql.Float, parseFloat(course.Longitude));
}

// Check if table exists and create it if it doesn't
async function ensureTableExists(tableName) {
    try {
        // Check if table exists
        const checkQuery = `
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = '${tableName}'
        `;
        const checkResult = await sql.query(checkQuery);
        
        // If table doesn't exist, create it
        if (checkResult.recordset[0].count === 0) {
            // Create table with same structure as template table
            const createQuery = `
                SELECT * INTO ${tableName} FROM BaseCourses
            `;
            await sql.query(createQuery);
            return { created: true, message: `Table '${tableName}' created successfully` };
        }
        
        return { created: false, message: `Table '${tableName}' already exists` };
    } catch (error) {
        throw new Error(`Failed to ensure table exists: ${error.message}`);
    }
}

module.exports = {
    buildSetClause,
    executeQuery,
    getTableName,
    prepareCourseParameters,
    ensureTableExists
};