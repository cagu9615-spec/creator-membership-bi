/**
 * EBOOK SALES CONNECTOR:
 * Extracts digital product sales data from Google Sheet,
 * normalizes transaction schemas based on exact column layout,
 * converts to NDJSON, and streams to GCS.
 */
function runEbookIngestion() {
  Logger.log("--- Starting Ebook Sales Ingestion ---");

  const rawSheetId = PropertiesService.getScriptProperties().getProperty('EBOOK_SHEET_ID');
  if (!rawSheetId) {
    Logger.log("ERROR: EBOOK_SHEET_ID missing in Script Properties.");
    return;
  }

  const cleanSheetId = rawSheetId.trim();
  Logger.log(`Attempting to open Sheet ID: ${cleanSheetId}`);

  let ss;
  try {
    ss = SpreadsheetApp.openById(cleanSheetId);
  } catch (err) {
    Logger.log(`FAILED to open sheet by ID: ${err.message}`);
    return;
  }

  const sheet = ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    Logger.log("No Ebook sales rows found. Skipping upload.");
    return;
  }

  const rows = data.slice(1);

  // Column mapping:
  // A: Order_id, B: Buyer_customer_id, C: Email, D: Product_title,
  // E: Purchase_date, F: Amount, G: Currency, H: Transaction_id
  const standardizedRecords = rows.map((row, idx) => ({
    order_id: row[0] ? row[0].toString() : null,
    buyer_customer_id: row[1] ? row[1].toString() : null,
    email: cleanEmail(row[2]),
    product_title: row[3] || 'Digital Ebook',
    purchase_date: row[4] ? new Date(row[4]).toISOString() : null,
    amount: row[5] !== "" ? parseFloat(row[5]) : 0.0,
    currency: row[6] ? row[6].toString().toUpperCase() : 'USD',
    transaction_id: row[7] ? row[7].toString() : `tx_${idx + 1}`,
    source_platform: 'ebook_csv',
    ingested_at: new Date().toISOString()
  }));

  const ndjsonString = convertToNDJSON(standardizedRecords);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const gcsPath = `ebook/sales/year=${year}/month=${month}/ebook_sales_raw_${now.getTime()}.ndjson`;

  uploadToGCS(ndjsonString, gcsPath);
  Logger.log(`--- Finished Ebook Ingestion (${standardizedRecords.length} records processed) ---`);
}
