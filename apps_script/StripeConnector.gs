/**
 * MASTER STRIPE PIPELINE: Ingests Customers, Charges, Subscriptions, and Prices.
 * Writes each entity to its respective GCS landing directory in NDJSON format.
 */
function runFullStripeIngestion() {
  Logger.log("--- Starting Full Stripe Ingestion ---");
  
  // 1. Ingest Customers
  ingestStripeEntity('customers', 'stripe/customers', record => ({
    stripe_customer_id: record.id,
    email: cleanEmail(record.email),
    created_at: record.created ? new Date(record.created * 1000).toISOString() : null,
    currency: record.currency || null,
    source_platform: 'stripe',
    ingested_at: new Date().toISOString()
  }));

  // 2. Ingest Charges / Payments
  ingestStripeEntity('charges', 'stripe/charges', record => ({
    charge_id: record.id,
    stripe_customer_id: record.customer || null,
    amount: record.amount / 100.0, // Converts cents to dollars
    currency: record.currency,
    status: record.status,
    paid: record.paid,
    created_at: record.created ? new Date(record.created * 1000).toISOString() : null,
    payment_intent: record.payment_intent || null,
    source_platform: 'stripe',
    ingested_at: new Date().toISOString()
  }));

  // 3. Ingest Subscriptions
  ingestStripeEntity('subscriptions', 'stripe/subscriptions', record => ({
    subscription_id: record.id,
    stripe_customer_id: record.customer || null,
    status: record.status,
    current_period_start: record.current_period_start ? new Date(record.current_period_start * 1000).toISOString() : null,
    current_period_end: record.current_period_end ? new Date(record.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: record.cancel_at_period_end || false,
    created_at: record.created ? new Date(record.created * 1000).toISOString() : null,
    source_platform: 'stripe',
    ingested_at: new Date().toISOString()
  }));

  // 4. Ingest Prices / Catalog
  ingestStripeEntity('prices', 'stripe/prices', record => ({
    price_id: record.id,
    product_id: record.product || null,
    active: record.active,
    unit_amount: record.unit_amount ? record.unit_amount / 100.0 : 0,
    currency: record.currency,
    type: record.type,
    source_platform: 'stripe',
    ingested_at: new Date().toISOString()
  }));

  Logger.log("--- Finished Full Stripe Ingestion ---");
}

/**
 * Helper function to fetch from Stripe API, format data, and call Utils.gs upload logic.
 */
function ingestStripeEntity(endpoint, gcsFolderPrefix, transformFn) {
  const stripeApiKey = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY'); 
  if (!stripeApiKey) {
    Logger.log(`ERROR: STRIPE_SECRET_KEY is missing from Script Properties!`);
    return;
  }

  const url = `https://api.stripe.com/v1/${endpoint}?limit=100`;
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + stripeApiKey,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log(`Failed to fetch ${endpoint}: ${response.getContentText()}`);
    return;
  }

  const rawData = JSON.parse(response.getContentText());
  const records = rawData.data || [];

  if (records.length === 0) {
    Logger.log(`No records found for Stripe ${endpoint}.`);
    return;
  }

  // Standardize & convert using Utils.gs
  const standardizedRecords = records.map(transformFn);
  const ndjsonString = convertToNDJSON(standardizedRecords);

  // Partition path: folder/year=YYYY/month=MM/file.ndjson
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const fileName = `${endpoint}_raw_${now.getTime()}.ndjson`;
  const gcsPath = `${gcsFolderPrefix}/year=${year}/month=${month}/${fileName}`;

  // Call uploadToGCS from Utils.gs
  uploadToGCS(ndjsonString, gcsPath);
}
