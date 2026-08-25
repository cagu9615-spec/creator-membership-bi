# Apps Script Ingestion Code
# 🏗️ CreatorHub Ingestion Pipeline Architecture

**Project Name:** `CreatorHub-Ingestion-Pipeline`  
**Target Storage Bucket:** `creator-membership-vault-9615`  
**Execution Platform:** Google Apps Script  

---

## 1. Architecture Overview
This pipeline automates the ingestion, schema standardization, and storage of cross-platform creator metrics into Google Cloud Storage (GCS) partitioned by date (`year=YYYY/month=MM`).

* **Stripe Connector (`StripeConnector.gs`):** Fetches charge metrics via API → NDJSON → `stripe/`
* **Shopify Connector (`ShopifyConnector.gs`):** Ingests e-commerce order data → NDJSON → `shopify/`
* **Calendly Connector (`CalendlyConnector.gs`):** Extracts booking and event info → NDJSON → `calendly/`
* **Substack Connector (`SubstackConnector.gs`):** Standardizes subscriber data from Sheets → NDJSON → `substack/`
* **Ebook Sales Connector (`EbookConnector.gs`):** Extracts digital product transactions → NDJSON → `ebook/`

---

## 2. Environment Configuration (Script Properties)

| Property Key | Description |
| :--- | :--- |
| `CALENDLY_PERSONAL_TOKEN` | Bearer auth token for Calendly v2 REST API |
| `EBOOK_SHEET_ID` | `1h7pu7Wi7CeF9VEpT28DQOuUYnps-bXlWluOK7HHHrPs` |
| `GCS_BUCKET_NAME` | `creator-membership-vault-9615` |
| `SHOPIFY_ADMIN_TOKEN` | Admin Access Token for Shopify Store API |
| `SHOPIFY_SHOP_NAME` | Store primary domain prefix |
| `STRIPE_SECRET_KEY` | Secret API key (`sk_test_...` / `sk_live_...`) |
| `SUBSTACK_SHEET_ID` | Google Sheet ID containing Substack subscriber exports |

---

## 3. Destination Data Layout (GCS)

All NDJSON files stream into Hive-partitioned paths:

```text
creator-membership-vault-9615/
├── calendly/year=YYYY/month=MM/calendly_events_raw_<timestamp>.ndjson
├── ebook/year=YYYY/month=MM/ebook_sales_raw_<timestamp>.ndjson
├── shopify/year=YYYY/month=MM/shopify_orders_raw_<timestamp>.ndjson
├── stripe/year=YYYY/month=MM/stripe_charges_raw_<timestamp>.ndjson
└── substack/year=YYYY/month=MM/substack_subscribers_raw_<timestamp>.ndjson
