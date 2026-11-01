# EduStream Week 5 Testing Report

## Scope
Testing covers front-end utilities, REST API behavior, authentication/authorization, classroom operations, quiz scoring, validation failures, compatibility endpoints, and caching behavior.

## Test strategy
- **Unit tests:** front-end utility functions are tested with Jest for API URL resolution and HTML escaping.
- **Integration tests:** Supertest exercises Express routes end-to-end against an isolated temporary JSON data store.
- **Validation tests:** protected endpoints, invalid score ranges, and missing/invalid classroom access are checked.
- **Performance checks:** the dashboard compatibility endpoint is tested for cache reuse; a local benchmark script compares repeated file reads with cached reads.

## Critical test cases
1. Instructor registration succeeds with a 201 response.
2. Login returns a JWT token.
3. Protected dashboard requests without a token return 401.
4. Instructor classroom creation and retrieval succeed.
5. Unauthorized classroom access is rejected.
6. Quiz scores above 100 are rejected with 400.
7. A correct quiz answer is recorded and returns a passing result.
8. Dashboard cache is reused on a repeated request.
9. Front-end API URL selection works for Live Server and same-origin deployment.
10. HTML output is escaped to reduce XSS risk in rendered names/titles.

## Expected outcome
The test suite should complete with all tests passing on Node.js 20+ after `npm install`.
