// Validate table name to prevent SQL injection
function validateTableName(tableName) {
    if (!tableName) {
        return false;
    }
    const validTableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return validTableNameRegex.test(tableName);
}

// Validate required course fields
function validateCourseFields(course, requiredFields = ['Course', 'Address', 'City', 'State', 'ZIP', 'Latitude', 'Longitude']) {
    const errors = [];
    
    for (const field of requiredFields) {
        if (course[field] === undefined || course[field] === null || course[field] === '') {
            errors.push(`${field} is required`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Validate course ID
function validateCourseId(courseId) {
    const id = parseInt(courseId);
    return !isNaN(id) && id > 0;
}

// Validate allowed fields for updates
function validateUpdateFields(updates) {
    const allowedFields = ['Course', 'Address', 'City', 'State', 'ZIP', 'Info', 'Access', 'Played', 'Latitude', 'Longitude'];
    const validUpdates = {};
    const errors = [];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            validUpdates[key] = value;
        } else {
            errors.push(`Field '${key}' is not allowed`);
        }
    }

    return {
        isValid: errors.length === 0 && Object.keys(validUpdates).length > 0,
        validUpdates,
        errors: errors.length === 0 && Object.keys(validUpdates).length === 0 
            ? ['No valid fields to update'] 
            : errors
    };
}

module.exports = {
    validateTableName,
    validateCourseFields,
    validateCourseId,
    validateUpdateFields
};