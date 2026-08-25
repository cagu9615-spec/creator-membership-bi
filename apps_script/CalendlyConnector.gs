/**
 * CALENDLY CONNECTOR:
 * Fetches scheduled events, extracts event invitees,
 * transforms payload into standardized NDJSON, and streams to GCS.
 */
function runCalendlyIngestion() {
  Logger.log("--- Starting Calendly API Ingestion ---");

  const token = PropertiesService.getScriptProperties().getProperty('CALENDLY_PERSONAL_TOKEN');
  if (!token) {
    Logger.log("ERROR: CALENDLY_PERSONAL_TOKEN missing in Script Properties.");
    return;
  }

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  // 1. Get Current User URI
  const userResp = UrlFetchApp.fetch('https://api.calendly.com/users/me', options);
  if (userResp.getResponseCode() !== 200) {
    Logger.log(`FAILED to fetch Calendly user (HTTP ${userResp.getResponseCode()}): ${userResp.getContentText()}`);
    return;
  }

  const userUri = JSON.parse(userResp.getResponseCode() === 200 ? userResp.getContentText() : '{}').resource.uri;
  Logger.log(`Authenticated Calendly User URI: ${userUri}`);

  // 2. Fetch Scheduled Events for User
  const eventsUrl = `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&count=100`;
  const eventsResp = UrlFetchApp.fetch(eventsUrl, options);

  if (eventsResp.getResponseCode() !== 200) {
    Logger.log(`FAILED to fetch Calendly scheduled events (HTTP ${eventsResp.getResponseCode()}): ${eventsResp.getContentText()}`);
    return;
  }

  const events = JSON.parse(eventsResp.getContentText()).collection || [];
  if (events.length === 0) {
    Logger.log("No scheduled events found in Calendly. Skipping upload.");
    return;
  }

  // 3. Fetch Invitees for Each Scheduled Event
  let allInvitees = [];
  events.forEach(event => {
    const eventUuid = event.uri.split('/').pop();
    const inviteesUrl = `https://api.calendly.com/scheduled_events/${eventUuid}/invitees`;
    const inviteesResp = UrlFetchApp.fetch(inviteesUrl, options);

    if (inviteesResp.getResponseCode() === 200) {
      const inviteeCollection = JSON.parse(inviteesResp.getContentText()).collection || [];
      inviteeCollection.forEach(inv => {
        allInvitees.push({
          ...inv,
          event_name: event.name || null,
          start_time: event.start_time || null,
          end_time: event.end_time || null
        });
      });
    }
  });

  if (allInvitees.length === 0) {
    Logger.log("No invitees found across scheduled events. Skipping upload.");
    return;
  }

  // 4. Transform & Normalize Records
  const standardizedRecords = allInvitees.map(record => ({
    appointment_id: `calendly_${record.uri.split('/').pop()}`,
    email: cleanEmail(record.email),
    name: record.name || null,
    status: record.status || 'active',
    event_name: record.event_name,
    start_time: record.start_time ? new Date(record.start_time).toISOString() : null,
    end_time: record.end_time ? new Date(record.end_time).toISOString() : null,
    timezone: record.timezone || null,
    created_at: record.created_at ? new Date(record.created_at).toISOString() : null,
    source_platform: 'calendly',
    ingested_at: new Date().toISOString()
  }));

  // 5. Convert to NDJSON & Save to GCS
  const ndjsonString = convertToNDJSON(standardizedRecords);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const gcsPath = `calendly/appointments/year=${year}/month=${month}/appointments_raw_${now.getTime()}.ndjson`;

  uploadToGCS(ndjsonString, gcsPath);
  Logger.log("--- Finished Calendly API Ingestion ---");
}
