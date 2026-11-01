# EduStream Development Error Log

These are representative errors observed during the Week 4/5 development and the corresponding fixes.

| Error | Root cause | Resolution |
|---|---|---|
| `405 Method Not Allowed` | Front end sent API requests to Live Server port 5500 | Added backend API base URL fallback and documented integrated startup on port 5000 |
| `Failed to fetch` | Backend was not reachable | Added clear startup instructions and a launcher that waits for the server |
| `ERR_INVALID_ARG_TYPE: The "url" argument ... undefined` | Missing `DATABASE_URL` | Removed external DB requirement for local mode |
| `Classroom.bulkCreate is not a function` | Model facade lacked the bootstrap method | Implemented `Classroom.bulkCreate()` |
| `Cannot find module 'express'` | Dependencies not installed in extracted project | Added setup checks and documentation |
| `localhost refused to connect` | Server crashed before listening | Added startup error handling and corrected data initialization |
