// This script acts as the extension's central nervous system.
// It listens for messages from the content script and makes the call
// to the same `analyzeInput` Server Action used by the main web application.

const ANALYSIS_ENDPOINT_URL = 'http://localhost:9002/api/analyze';

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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // The body might be the original payload or the new one with the Data URI
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Analysis request failed with status: ${res.status}. Body: ${errorBody}`);
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