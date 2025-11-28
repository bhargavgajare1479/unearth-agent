// This script is injected into social media pages.
// It will be responsible for finding posts and adding the "Fact Check" button.

// --- UI & MODAL ---

function createModal() {
  const modal = document.createElement("div");
  modal.id = "unearth-agent-modal";
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 99999;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 20px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #333;
    display: none;
    flex-direction: column;
    max-height: 80vh;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 15px;
  `;

  const title = document.createElement("h2");
  title.textContent = "Unearth Agent Analysis";
  title.style.margin = "0";
  title.style.fontSize = "18px";

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.style.cssText = `
    border: none;
    background: transparent;
    font-size: 24px;
    cursor: pointer;
  `;
  closeButton.onclick = () => (modal.style.display = "none");

  header.appendChild(title);
  header.appendChild(closeButton);

  const content = document.createElement("div");
  content.id = "unearth-agent-modal-content";
  content.style.overflowY = "auto";

  modal.appendChild(header);
  modal.appendChild(content);

  document.body.appendChild(modal);
  return modal;
}

const modal = createModal();
const modalContent = document.getElementById("unearth-agent-modal-content");

function showLoading() {
  modal.style.display = "flex";
  modalContent.innerHTML = `<p style="text-align: center;">Analyzing... This may take a moment.</p>`;
}

function showResults(data) {
  if (!data.success) {
    modalContent.innerHTML = `<p style="color: red; font-weight: bold;">Analysis Failed</p><p>${
      data.error || "An unknown error occurred."
    }</p>`;
    return;
  }

  const results = data.results;
  const score = results.misScore?.misinformationImmunityScore ?? "N/A";
  let reasoning = "No detailed analysis available.";
  if (results.urlAnalysis) reasoning = results.urlAnalysis.riskReasoning;
  if (results.textAnalysis) reasoning = results.textAnalysis.riskReasoning;
  if (results.imageAnalysis) reasoning = results.imageAnalysis.riskReasoning;
  if (results.verification) reasoning = results.verification.gdeltResults;

  let scoreColor = "#333";
  if (score > 75) scoreColor = "#22c55e"; // green
  else if (score > 40) scoreColor = "#f59e0b"; // amber
  else if (score !== "N/A") scoreColor = "#ef4444"; // red

  modalContent.innerHTML = `
    <div style="text-align: center;">
      <h3 style="margin-top: 0; font-size: 16px; color: #555;">Misinformation Immunity Score</h3>
      <p style="font-size: 48px; font-weight: bold; margin: 10px 0; color: ${scoreColor};">${score}</p>
    </div>
    <div>
      <h4 style="margin-bottom: 5px;">Analysis Summary:</h4>
      <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 14px; border-left: 3px solid ${scoreColor};">${reasoning}</p>
    </div>
  `;
}

// --- LOGIC ---

function createFactCheckButton(postElement, insertBefore = null) {
  const button = document.createElement("button");
  button.innerText = "Fact Check";
  button.className = "unearth-agent-button"; // Add a class for styling and to avoid re-adding
  button.style.cssText = `
    background-color: #386641;
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 8px;
    opacity: 0.8;
    transition: opacity 0.2s;
  `;
  button.onmouseover = () => (button.style.opacity = "1");
  button.onmouseout = () => (button.style.opacity = "0.8");

  button.onclick = async (e) => {
    e.stopPropagation(); // Prevent navigating to the tweet when clicking the button
    e.preventDefault();

    showLoading();
    let payload = null;

    // Extract the best content candidate for analysis
    const analyzed = extractContentFromPost(postElement);
    if (analyzed && analyzed.type === "text") {
      payload = { type: "text", content: analyzed.content };
    } else if (analyzed && analyzed.type === "url") {
      // If the URL is already a data URI, use it directly
      if (analyzed.content.startsWith("data:")) {
        // Detect image/video from the data URI's MIME type
        if (analyzed.content.startsWith("data:image")) {
          payload = { type: "image", dataUri: analyzed.content };
        } else if (
          analyzed.content.startsWith("data:video") ||
          analyzed.content.startsWith("data:audio")
        ) {
          payload = { type: "video", dataUri: analyzed.content };
        } else {
          // Unknown MIME type: fallback to URL-based analysis
          payload = { type: "url", content: analyzed.content };
        }
      } else {
        // Request the background to fetch and convert to data URI so we can send it for analysis
        showLoading();
        console.debug(
          "Unearth Agent: requesting fetchMedia for",
          analyzed.content
        );
        // If this is a blob: URL we can handle it in the page context without background proxy
        if (analyzed.content.startsWith("blob:")) {
          fetchBlobUrlAsDataUri(analyzed.content).then((dataUri) => {
            if (!dataUri) {
              chrome.runtime.sendMessage(
                {
                  action: "analyzeContent",
                  payload: { type: "url", content: analyzed.content },
                  origin: window.location.origin,
                },
                showResults
              );
              return;
            }
            // Determine if blob is image or video
            const ct = dataUri.split(";")[0];
            if (ct.includes("image"))
              chrome.runtime.sendMessage(
                {
                  action: "analyzeContent",
                  payload: { type: "image", dataUri },
                  origin: window.location.origin,
                },
                showResults
              );
            else
              chrome.runtime.sendMessage(
                {
                  action: "analyzeContent",
                  payload: { type: "video", dataUri },
                  origin: window.location.origin,
                },
                showResults
              );
          });
          return;
        }

        chrome.runtime.sendMessage(
          { action: "fetchMedia", payload: { url: analyzed.content } },
          (resp) => {
            if (!resp || !resp.success) {
              console.warn(
                "Unearth Agent: background fetchMedia failed, falling back to URL",
                resp && resp.error
              );
              // Fallback: send URL directly to the server to try fetching it
              chrome.runtime.sendMessage(
                {
                  action: "analyzeContent",
                  payload: { type: "url", content: analyzed.content },
                  origin: window.location.origin,
                },
                showResults
              );
              return;
            }

            const { dataUri, contentType } = resp;
            // Choose the correct input type expected by the analysis endpoint
            if (contentType && contentType.includes("image")) {
              chrome.runtime.sendMessage(
                {
                  action: "analyzeContent",
                  payload: { type: "image", dataUri },
                  origin: window.location.origin,
                },
                showResults
              );
            } else if (
              contentType &&
              (contentType.includes("video") || contentType.includes("audio"))
            ) {
              chrome.runtime.sendMessage(
                {
                  action: "analyzeContent",
                  payload: { type: "video", dataUri },
                  origin: window.location.origin,
                },
                showResults
              );
            } else {
              // Unknown content type; fall back to URL analysis
              chrome.runtime.sendMessage(
                {
                  action: "analyzeContent",
                  payload: { type: "url", content: analyzed.content },
                  origin: window.location.origin,
                },
                showResults
              );
            }
          }
        );
        // We bail out here because the async response will call showResults or fallback
        return;
      }
    }

    if (payload) {
      console.debug(
        "Unearth Agent: sending analyzeContent payload type",
        payload.type
      );
      chrome.runtime.sendMessage(
        { action: "analyzeContent", payload, origin: window.location.origin },
        showResults
      );
    } else {
      showResults({
        success: false,
        error:
          "Couldn't find analyzable content (text, image, or video) in this post.",
      });
    }
  };

  // If an insertion point was provided, insert before it, otherwise append to the post
  if (insertBefore && insertBefore.parentElement) {
    insertBefore.parentElement.insertBefore(button, insertBefore);
  } else {
    postElement.appendChild(button);
  }

  return button;
}

// --- Site detection & Post collection helpers ---
function getSiteType() {
  const h = window.location.hostname;
  if (h.includes("x.com") || h.includes("twitter.com")) return "x";
  if (h.includes("instagram") || h.includes("instagramc")) return "instagram";
  if (h.includes("facebook.com")) return "facebook";
  if (
    document.querySelector("article") ||
    document.querySelector("main article")
  )
    return "article";
  return "other";
}

function extractContentFromPost(postElement) {
  try {
    const video =
      postElement.querySelector("video[src]") ||
      postElement.querySelector("video");
    if (video && video.src) return { type: "url", content: video.src };
    const image = postElement.querySelector(
      "img[src], img[data-src], img[srcset]"
    );
    if (image) {
      let src =
        image.getAttribute("src") ||
        image.getAttribute("data-src") ||
        image.getAttribute("srcset");
      if (src && src.includes(",")) {
        const parts = src.split(",").map((s) => s.trim());
        const last = parts[parts.length - 1].split(" ")[0];
        src = last;
      }
      if (src) return { type: "url", content: src };
    }
    const text =
      postElement.querySelector('[data-testid="tweetText"]') ||
      postElement.querySelector("p") ||
      postElement.querySelector("h1") ||
      postElement.querySelector("h2");
    if (text && text.innerText)
      return { type: "text", content: text.innerText };
    const combinedText = (postElement.innerText || "").trim();
    if (combinedText.length > 20)
      return { type: "text", content: combinedText.slice(0, 500) };
    return null;
  } catch (err) {
    console.error("extractContentFromPost error", err);
    return null;
  }
}

// Convert an ArrayBuffer to a Base64 data URI with a given MIME type
function arrayBufferToDataUri(
  arrayBuffer,
  mimeType = "application/octet-stream"
) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000; // large chunk size for performance
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

// Attempt to fetch a blob URL directly from the page context and convert to a data URI
async function fetchBlobUrlAsDataUri(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch blob url: ${resp.status}`);
    const contentType =
      resp.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await resp.arrayBuffer();
    return arrayBufferToDataUri(arrayBuffer, contentType);
  } catch (err) {
    console.error("fetchBlobUrlAsDataUri error", err);
    return null;
  }
}

function collectPosts() {
  const site = getSiteType();
  let nodeList = [];
  if (site === "x")
    nodeList = document.querySelectorAll('article[data-testid="tweet"]');
  else if (site === "instagram")
    nodeList = document.querySelectorAll("article");
  else if (site === "facebook")
    nodeList = document.querySelectorAll('div[role="article"]');
  else if (site === "article") nodeList = document.querySelectorAll("article");
  else
    nodeList = document.querySelectorAll(
      'article, div[role="article"], section'
    );
  // Filter to ensure posts that contain analyzable content are prioritized
  return [...nodeList].filter(
    (p) =>
      p &&
      (p.querySelector("img[src]") ||
        p.querySelector("video") ||
        p.querySelector("p") ||
        p.querySelector("h1") ||
        p.querySelector("h2"))
  );
}

function addButtonsToPosts() {
  const posts = collectPosts();
  posts.forEach((post) => {
    if (post.querySelector(".unearth-agent-button")) return;
    // Attempt to find an action bar or footer for the post to place our button
    const actionBar = post.querySelector(
      'div[role="group"], footer, section, ._abm0, ._9esb, ._a9zp'
    );
    createFactCheckButton(post, actionBar);
  });
}

// Run the function initially and then use a MutationObserver to watch for new posts being added to the page
// This is more efficient than running a setInterval
addButtonsToPosts();

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      addButtonsToPosts();
      break; // No need to check all mutations if we already found new nodes
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

console.log("Unearth Agent content script loaded and observing.");
