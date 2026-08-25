/**
 * Transforms an array of objects into Newline Delimited JSON (NDJSON)
 */
function convertToNDJSON(dataArray) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return "";
  return dataArray.map(item => JSON.stringify(item)).join('\n');
}

/**
 * Standardizes email strings for cross-platform matching
 */
function cleanEmail(email) {
  if (!email) return null;
  return email.toString().toLowerCase().trim();
}

/**
 * Uploads raw NDJSON payload directly into Google Cloud Storage bucket
 */
function uploadToGCS(ndjsonPayload, destinationPath) {
  const bucketName = PropertiesService.getScriptProperties().getProperty('GCS_BUCKET_NAME');
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME is missing in Script Properties.");
  }

  const encodedPath = encodeURIComponent(destinationPath);
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodedPath}`;
  
  const options = {
    method: 'post',
    contentType: 'application/x-ndjson',
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    payload: ndjsonPayload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode === 200 || statusCode === 201) {
    Logger.log(`SUCCESS: Uploaded to gs://${bucketName}/${destinationPath}`);
  } else {
    throw new Error(`GCS Upload Failed (${statusCode}): ${response.getContentText()}`);
  }
}
