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

module.exports = {
    buildSetClause,
    executeQuery,
    getTableName,
    prepareCourseParameters
};