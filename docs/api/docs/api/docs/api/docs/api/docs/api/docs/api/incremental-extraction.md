# Incremental Extraction (Watermarking)

## High-Efficiency Delta Ingestion
To minimize processing time and API quota usage, execution scripts record the timestamp of the last successful run (`last_run_timestamp`). Subsequent syncs pass parameters like `created[gte]=<last_run_timestamp>` to fetch only newly modified or created records.
