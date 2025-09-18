# Azure Functions Backend for Golf Courses Map

This Azure Function serves golf course data from an Azure SQL Database at the endpoint `/api/courses`.

## Setup Steps

1. Create an Azure SQL Database and import your golf course data into a table named `MasterList_USA`.
2. Update the Azure Function app settings with your SQL credentials:
   - `SQL_USER`
   - `SQL_PASSWORD`
   - `SQL_SERVER` (e.g., `your-server.database.windows.net`)
   - `SQL_DATABASE`
3. Deploy the `GetCourses` function to Azure Functions (Node.js runtime).
4. Install dependencies by running `npm install` in the function folder.
5. The frontend will fetch data from `/api/courses`.

## Table Schema Example

```
CREATE TABLE GolfCourses (
    Course NVARCHAR(255),
    Address NVARCHAR(255),
    City NVARCHAR(100),
    State NVARCHAR(50),
    Info NVARCHAR(255),
    Access NVARCHAR(50),
    ZIP NVARCHAR(20),
    Played INT,
    Latitude FLOAT,
    Longitude FLOAT
);
```

## Local Development
- Use Azure Functions Core Tools to run locally: `func start`
- Set environment variables in `local.settings.json` or your shell.

## Deployment
- Deploy using VS Code, Azure CLI, or GitHub Actions.
- Ensure your function app has access to the Azure SQL Database.
