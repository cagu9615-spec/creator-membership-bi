/**
 * PRODUCTION SHOPIFY PIPELINE:
 * Extracts live Customers, Orders, and Products directly from Shopify REST API.
 * Transforms records into standardized JSON/NDJSON format.
 * Stream-uploads files directly into Google Cloud Storage landing partition paths.
 */
function runFullShopifyIngestion() {
  Logger.log("--- Starting Full Shopify Live API Ingestion ---");

  // 1. Extract & Ingest Customers
  ingestShopifyEntity('customers', 'shopify/customers', record => ({
    shopify_customer_id: `shopify_${record.id}`,
    first_name: record.first_name || null,
    last_name: record.last_name || null,
    email: cleanEmail(record.email),
    phone: record.phone || null,
    orders_count: record.orders_count || 0,
    total_spent: record.total_spent ? parseFloat(record.total_spent) : 0.0,
    state: record.state || null,
    verified_email: record.verified_email || false,
    currency: record.currency || 'USD',
    created_at: record.created_at ? new Date(record.created_at).toISOString() : null,
    updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : null,
    source_platform: 'shopify',
    ingested_at: new Date().toISOString()
  }));

  // 2. Extract & Ingest Orders (appends status=any to catch open, closed, and canceled orders)
  ingestShopifyEntity('orders', 'shopify/orders', record => ({
    order_id: `shopify_order_${record.id}`,
    order_number: record.order_number || null,
    shopify_customer_id: record.customer ? `shopify_${record.customer.id}` : null,
    email: record.customer ? cleanEmail(record.customer.email) : cleanEmail(record.email),
    total_price: record.total_price ? parseFloat(record.total_price) : 0.0,
    subtotal_price: record.subtotal_price ? parseFloat(record.subtotal_price) : 0.0,
    total_tax: record.total_tax ? parseFloat(record.total_tax) : 0.0,
    total_discounts: record.total_discounts ? parseFloat(record.total_discounts) : 0.0,
    currency: record.currency || 'USD',
    financial_status: record.financial_status || null,
    fulfillment_status: record.fulfillment_status || 'unfulfilled',
    line_items_count: record.line_items ? record.line_items.length : 0,
    created_at: record.created_at ? new Date(record.created_at).toISOString() : null,
    updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : null,
    source_platform: 'shopify',
    ingested_at: new Date().toISOString()
  }), '?status=any');

  // 3. Extract & Ingest Products Catalog
  ingestShopifyEntity('products', 'shopify/products', record => ({
    product_id: `shopify_prod_${record.id}`,
    title: record.title || null,
    body_html_snippet: record.body_html ? record.body_html.substring(0, 150) : null,
    vendor: record.vendor || null,
    product_type: record.product_type || null,
    status: record.status || 'active',
    tags: record.tags || null,
    variants_count: record.variants ? record.variants.length : 0,
    created_at: record.created_at ? new Date(record.created_at).toISOString() : null,
    updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : null,
    source_platform: 'shopify',
    ingested_at: new Date().toISOString()
  }));

  Logger.log("--- Finished Full Shopify Live API Ingestion ---");
}

/**
 * Core Helper Function: Fetches live data from Shopify REST endpoints,
 * maps fields, converts to NDJSON, and calls Utils.gs uploadToGCS.
 */
function ingestShopifyEntity(endpoint, gcsFolderPrefix, transformFn, extraQueryParams = '') {
  const shopName = PropertiesService.getScriptProperties().getProperty('SHOPIFY_SHOP_NAME') || 'creatorhub-store-lab';
  const shopifyToken = PropertiesService.getScriptProperties().getProperty('SHOPIFY_ADMIN_TOKEN');

  if (!shopifyToken) {
    Logger.log(`ERROR: SHOPIFY_ADMIN_TOKEN is missing in Script Properties! Cannot fetch ${endpoint}.`);
    return;
  }

  // Fetch up to 250 records from the Shopify REST Admin API
  const url = `https://${shopName}.myshopify.com/admin/api/2024-01/${endpoint}.json?limit=250${extraQueryParams ? '&' + extraQueryParams.replace('?', '') : ''}`;
  
  const options = {
    method: 'get',
    headers: {
      'X-Shopify-Access-Token': shopifyToken,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    Logger.log(`FAILED to fetch ${endpoint} from Shopify (HTTP ${responseCode}): ${response.getContentText()}`);
    return;
  }

  const rawData = JSON.parse(response.getContentText());
  const records = rawData[endpoint] || [];

  if (records.length === 0) {
    Logger.log(`No records found in Shopify for endpoint '${endpoint}'. Skipping upload.`);
    return;
  }

  // Standardize records using transform function
  const standardizedRecords = records.map(transformFn);

  // Convert standardized JSON array to NDJSON string via Utils.gs
  const ndjsonString = convertToNDJSON(standardizedRecords);

  // Build partitioned GCS target path: shopify/entity/year=YYYY/month=MM/file.ndjson
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const fileName = `${endpoint}_raw_${now.getTime()}.ndjson`;
  const gcsPath = `${gcsFolderPrefix}/year=${year}/month=${month}/${fileName}`;

  // Upload to Cloud Storage using uploadToGCS function in Utils.gs
  uploadToGCS(ndjsonString, gcsPath);
}
