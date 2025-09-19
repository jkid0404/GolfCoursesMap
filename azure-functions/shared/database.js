const sql = require('mssql');

// Database configuration
function getConfig() {
    const connectionString = process.env.SQLAZURECONNSTR_DefaultConnection;
    
    if (connectionString) {
        return connectionString;
    } else {
        return {
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            server: process.env.SQL_SERVER,
            database: process.env.SQL_DATABASE,
            options: {
                encrypt: true
            }
        };
    }
}

// Connect to database
async function connectToDatabase() {
    const config = getConfig();
    return await sql.connect(config);
}

// Close database connection
async function closeDatabaseConnection() {
    try {
        await sql.close();
    } catch (closeError) {
        console.error('Error closing SQL connection:', closeError);
    }
}

module.exports = {
    connectToDatabase,
    closeDatabaseConnection,
    sql
};