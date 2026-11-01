# EduStream — Week 5: Testing, Debugging & Optimization

This package extends the Week 4 integrated EduStream application with automated tests, debugging documentation, error logs, and performance-oriented improvements.

## Requirements
- Node.js 20 or newer
- npm

## Run the test suite
From `backend/edustream-backend`:

```cmd
npm install
npm test
```

Run the performance benchmark from the project root:

```cmd
node scripts/benchmark.js
```

## Test structure
- `backend/edustream-backend/tests/api.test.js` — authenticated REST API integration tests.
- `backend/edustream-backend/server.test.js` — compatibility endpoint, validation, and cache tests.
- `backend/edustream-backend/tests/frontend-utils.test.js` — front-end utility unit tests included in the Jest suite.

## Reports
- `reports/TEST_REPORT.md` — test strategy and cases.
- `reports/DEBUGGING_REPORT.md` — debugging process, causes, fixes, and lessons learned.
- `reports/ERROR_LOG.md` — development error log and resolutions.
- `reports/OPTIMIZATION_REPORT.md` — profiling approach and optimizations.

## Run the application
From `backend/edustream-backend`:

```cmd
npm start
```

Then open `http://localhost:5000`.

Demo account:
- Email: `prof@edustream.edu`
- Password: `password123`

## Notes
The application uses a local JSON data store for zero-setup Windows execution. No PostgreSQL service is required.
