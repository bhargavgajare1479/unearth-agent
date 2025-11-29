// This script acts as the extension's central nervous system.
// It listens for messages from the content script and makes the call
// to the same `analyzeInput` Server Action used by the main web application.

// The URL to your deployed Next.js application's server action endpoint.
// In a real deployment, this would be your production URL.
// For local testing, we'll use the localhost address.
const ANALYSIS_ENDPOINT_URL = "http://127.0.0.1:9002/api/analyze";

async function analyzeContent(request, sendResponse) {
  try {
    // The analyzeInput function is not directly accessible from the extension.
    // We need to make a network request to an API route that we will create.
    // This API route will, in turn, call the analyzeInput server action.
    const res = await fetch(ANALYSIS_ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request.payload),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `Analysis request failed with status: ${res.status}. Body: ${errorBody}`
      );
    }

    const results = await res.json();
    sendResponse({ success: true, results });
  } catch (error) {
    console.error("Unearth Agent: Analysis failed", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Fetch a cross-origin media resource (image/video) and convert to a data URI
async function fetchMedia(request, sendResponse) {
  try {
    const { url } = request.payload || {};
    if (!url) throw new Error("No url provided");

    console.debug("Unearth Agent background: fetchMedia for", url);
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Failed to fetch media: ${res.status} ${errorBody}`);
    }
    const contentType =
      res.headers.get("content-type") || "application/octet-stream";
    const buffer = await res.arrayBuffer();
    // Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    const base64 = btoa(binary);
    const dataUri = `data:${contentType};base64,${base64}`;
    console.debug(
      "Unearth Agent background: fetchMedia success:",
      contentType,
      "size",
      bytes.length
    );
    sendResponse({ success: true, dataUri, contentType });
  } catch (error) {
    console.error("fetchMedia failed", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeContent") {
    // The analysis can be async, so we return true to indicate
    // that we will call sendResponse later.
    analyzeContent(request, sendResponse);
    return true;
  }
  if (request.action === "translate") {
    fetch(ANALYSIS_ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "translate", ...request.payload }),
    })
      .then(r => r.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (request.action === "vote") {
    fetch(ANALYSIS_ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "vote", ...request.payload }),
    })
      .then(r => r.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (request.action === "fetchMedia") {
    fetchMedia(request, sendResponse);
    return true;
  }
});

console.log("Unearth Agent background script loaded.");
