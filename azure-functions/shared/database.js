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

// Helper function to wait/sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Connect to database with retry logic
async function connectToDatabase() {
    const config = getConfig();
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Database connection attempt ${attempt}/${maxRetries}`);
            return await sql.connect(config);
        } catch (error) {
            console.error(`Database connection attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxRetries) {
                console.error(`All ${maxRetries} database connection attempts failed`);
                throw error;
            }
            
            console.log(`Waiting ${retryDelay/1000} seconds before retry...`);
            await sleep(retryDelay);
        }
    }
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