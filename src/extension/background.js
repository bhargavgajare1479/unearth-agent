// This script acts as the extension's central nervous system.
// It listens for messages from the content script and makes the call
// to the same `analyzeInput` Server Action used by the main web application.

// The URL to your deployed Next.js application's server action endpoint.
// In a real deployment, this would be your production URL.
// For local testing, you might need to use something like http://localhost:9002 if your app runs there.
const ANALYSIS_ENDPOINT_URL = '/api/analyze'; // We'll use a relative URL which works if the extension is used on the same origin, but for cross-origin we'd need the full URL.

async function analyzeContent(request, sendResponse) {
  try {
    // The analyzeInput function is not directly accessible from the extension.
    // We need to make a network request to an API route that we will create.
    // This API route will, in turn, call the analyzeInput server action.
    const res = await fetch(new URL(ANALYSIS_ENDPOINT_URL, request.origin).href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.payload),
    });

    if (!res.ok) {
      throw new Error(`Analysis request failed with status: ${res.status}`);
    }

    const results = await res.json();
    sendResponse({ success: true, results });
  } catch (error) {
    console.error('Unearth Agent: Analysis failed', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeContent') {
    // The analysis can be async, so we return true to indicate
    // that we will call sendResponse later.
    analyzeContent(request, sendResponse);
    return true;
  }
});

console.log('Unearth Agent background script loaded.');
