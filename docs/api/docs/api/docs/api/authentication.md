# Authentication & Security Protocol

## Key Management
1. API secret keys (Bearer tokens) are stored in secure environment variables or Google Apps Script `PropertiesService.getScriptProperties()`.
2. Raw API credentials are NEVER committed to GitHub or hardcoded into client scripts.
3. Requests authenticate using Authorization headers: `Authorization: Bearer <SECRET_KEY>`.
