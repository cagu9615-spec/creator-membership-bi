/**
 * SUBSTACK CONNECTOR:
 * Reads raw exported subscriber data from Google Sheet,
 * standardizes column mappings, converts to NDJSON, and streams to GCS.
 */
function runSubstackIngestion() {
  Logger.log("--- Starting Substack Sheet Ingestion ---");

  const sheetId = PropertiesService.getScriptProperties().getProperty('SUBSTACK_SHEET_ID');
  if (!sheetId) {
    Logger.log("ERROR: SUBSTACK_SHEET_ID missing in Script Properties.");
    return;
  }

  // Open external sheet by ID
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheets()[0]; // Grabs first active tab
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    Logger.log("No Substack data rows found. Skipping upload.");
    return;
  }

  // Extract data rows (skip header row at index 0)
  const rows = data.slice(1);

  // Map columns based on your sheet layout:
  // A: Subscriber_id, B: Full_name, C: Email, D: Subscription_tier,
  // E: Open_rate_pct, F: Click_rate_pct, G: Signup_date, H: Status, I: Plan_details
  const standardizedRecords = rows.map((row, idx) => ({
    subscriber_id: row[0] ? row[0].toString() : `sub_${idx + 1}`,
    full_name: row[1] || null,
    email: cleanEmail(row[2]),
    subscription_tier: row[3] || 'Free Subscriber',
    open_rate_pct: row[4] !== "" ? parseFloat(row[4]) : 0,
    click_rate_pct: row[5] !== "" ? parseFloat(row[5]) : 0,
    signup_date: row[6] ? new Date(row[6]).toISOString() : null,
    status: row[7] || 'Active',
    plan_details: row[8] || null,
    source_platform: 'substack',
    ingested_at: new Date().toISOString()
  }));

  // Convert to NDJSON & Save to GCS
  const ndjsonString = convertToNDJSON(standardizedRecords);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const gcsPath = `substack/subscribers/year=${year}/month=${month}/subscribers_raw_${now.getTime()}.ndjson`;

  uploadToGCS(ndjsonString, gcsPath);
  Logger.log(`--- Finished Substack Sheet Ingestion (${standardizedRecords.length} records processed) ---`);
}
