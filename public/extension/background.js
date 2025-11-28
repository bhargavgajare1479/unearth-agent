// The extension's background service worker handles messages from the content script and communicates with the
// local analysis backend. We also add a helper to fetch remote image/video resources and return them as data URIs
// so the server can OCR/transcribe when the original resource is not directly accessible (403/CORS).

const ANALYSIS_ENDPOINT_URL = "http://localhost:9002/api/analyze";

async function analyzeContent(request, sendResponse) {
  try {
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

// Fetch a cross-origin media resource and convert to data URI with credentials included
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeContent") {
    analyzeContent(request, sendResponse);
    return true;
  }
  if (request.action === "fetchMedia") {
    fetchMedia(request, sendResponse);
    return true;
  }
});

console.log("Unearth Agent background script loaded.");
chrome.runtime.onMessage.addListener((t, e, a) => {
  if ("analyzeContent" === t.action)
    return (
      (async function (t, e) {
        try {
          const a = await fetch("http://localhost:9002/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(t.payload),
          });
          if (!a.ok) {
            const t = await a.text();
            throw new Error(
              `Analysis request failed with status: ${a.status}. Body: ${t}`
            );
          }
          e({ success: !0, results: await a.json() });
        } catch (t) {
          console.error("Unearth Agent: Analysis failed", t),
            e({ success: !1, error: t.message });
        }
      })(t, a),
      !0
    );
}),
  console.log("Unearth Agent background script loaded.");
//# sourceMappingURL=background.js.map
