// This script acts as the extension's central nervous system.
// It listens for messages from the content script and makes the call
// to the same `analyzeInput` Server Action used by the main web application.

// IMPORTANT: FOR FIREBASE STUDIO TESTING
// Replace the placeholder URL below with the actual public URL for port 9002 from your Firebase Studio workspace.
// You can find this in the "Ports" tab in your workspace.
const ANALYSIS_ENDPOINT_URL = 'https://<YOUR_FIREBASE_STUDIO_WORKSPACE_URL>/api/analyze';

// Helper function to fetch an image and convert it to a Data URI
async function fetchImageAsDataUri(imageUrl) {
  try {
    // The `fetch` API in a background script has fewer CORS restrictions
    // than in a content script, allowing us to fetch cross-origin images.
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Unearth Agent: Failed to convert image to Data URI', error);
    return null;
  }
}


async function analyzeContent(request, sendResponse) {
  try {
    let payload = request.payload;

    // Before making the request, check if the placeholder URL is still there.
    if (ANALYSIS_ENDPOINT_URL.includes('<YOUR_FIREBASE_STUDIO_WORKSPACE_URL>')) {
      throw new Error('The extension backend URL has not been configured. Please update src/extension/background.js with your public workspace URL.');
    }

    // If the payload is an image URL, we need to process it first.
    if (payload.type === 'image' && payload.content.startsWith('http')) {
      const imageDataUri = await fetchImageAsDataUri(payload.content);
      if (imageDataUri) {
        // Replace the image URL with the full Data URI for analysis
        payload = { type: 'image', dataUri: imageDataUri };
      } else {
        // If fetching the image as data fails, fall back to URL analysis.
        payload = { type: 'url', content: payload.content };
      }
    }

    const res = await fetch(ANALYSIS_ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // The body might be the original payload or the new one with the Data URI
      body: JSON.stringify(payload),
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
