# EduStream Week 5 Optimization Report

## Optimizations implemented

### 1. In-memory data-store caching
Repeated API requests previously caused JSON parsing and file reads for every model operation. The local data layer now caches the loaded store in memory during normal development and refreshes the cache whenever data is written. This reduces repeated filesystem I/O while preserving persistence.

### 2. Dashboard response caching
The legacy dashboard compatibility endpoint uses a 60-second TTL cache. Repeated requests are served from memory rather than rebuilding the response.

### 3. Static asset caching
Express static assets are served with a one-hour cache lifetime, reducing repeated browser downloads during local testing.

### 4. Request-body limit
JSON request bodies are limited to 32 KB to prevent unnecessarily large payloads from consuming memory.

### 5. Request timing instrumentation
The server records method, route, status, and response time, making API bottlenecks easier to identify during debugging and performance testing.

### 6. Reduced test coupling
Integration tests use a temporary data file instead of the demo data store. This makes runs repeatable and avoids cleanup of user-facing application data.

## Profiling method
Use `node scripts/benchmark.js` to compare repeated file reads and cached reads. The script reports total and per-operation times. Actual results depend on the computer's disk and CPU performance.
