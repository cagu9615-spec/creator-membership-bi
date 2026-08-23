# Pagination Mechanics

## Cursor-Based Extraction
Platform APIs cap batch sizes at 100 objects per call. The ingestion loop tracks the final object ID and sets `starting_after=<LAST_ID>` for subsequent batch requests until `has_more: false` is returned.
