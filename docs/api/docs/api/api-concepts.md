# REST API Core Concepts

## Communication Model
CreatorHub retrieves platform data via HTTPS GET requests using `UrlFetchApp.fetch()` in Google Apps Script or `requests.get()` in Python.

## Core HTTP Status Codes
- **200 OK:** Successful data extraction.
- **400 Bad Request:** Query parameter syntax error.
- **401 Unauthorized:** Missing or invalid API secret key.
- **404 Not Found:** Endpoint resource does not exist.
- **429 Rate Limit:** System exceeded request quota; requires pause and retry.
