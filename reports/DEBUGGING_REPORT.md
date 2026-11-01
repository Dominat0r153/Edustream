# EduStream Week 5 Debugging Report

## Issues investigated

### 1. API contract mismatch
The front end originally requested dashboard/classroom endpoints that did not match the authenticated `/api/v1` routes. The integration was normalized around `/api/v1` and a backend URL fallback for Live Server.

### 2. PostgreSQL URL failure
Local startup previously attempted to construct a database connection from an undefined `DATABASE_URL`, causing `ERR_INVALID_ARG_TYPE`. The local version now uses a zero-setup JSON store and does not require PostgreSQL.

### 3. Missing bulkCreate implementation
Startup initially crashed because the custom Classroom model did not implement `bulkCreate`. The compatibility model now includes `bulkCreate` with validation.

### 4. Missing dependencies
Windows startup can fail with `Cannot find module 'express'` when dependencies have not been installed. The project documentation and startup flow now explicitly handle dependency installation.

### 5. Live Server connection failures
Opening only `127.0.0.1:5500` starts the static front end but not the API server. The recommended integrated flow is `http://localhost:5000`, and the front-end code also supports Live Server when the backend is already running.

## Debugging techniques used
- Read stack traces from the first failing frame.
- Verified working directory and presence of `package.json`.
- Added controlled startup error logging.
- Added request timing logs for API profiling.
- Added automated regression tests for each defect area.
- Isolated integration tests with a temporary data file so tests do not modify the demo database.

## Lessons learned
The most important lesson was to test the full startup path, not only individual modules. Keeping the API contract, environment configuration, data layer, and browser entry point consistent prevents repeated integration failures.
