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
  console.log("Unearth Agent: showResults", data);
  if (!data.success) {
    modalContent.innerHTML = `<p style="color: red; font-weight: bold;">Analysis Failed</p><p>${data.error || "An unknown error occurred."
      }</p>
    <p style="font-size: 10px; color: #999; margin-top: 10px;">Check the extension console or server logs for more details.</p>`;
    return;
  }

  const results = data.results;
  const score = results.misScore?.misinformationImmunityScore ?? "N/A";
  let reasoning = "No detailed analysis available.";
  let details = "";
  let facts = "";

  // Helper to format list
  const formatList = (items) => items.map(i => `<li>${i}</li>`).join('');

  if (results.urlAnalysis) {
    reasoning = results.urlAnalysis.riskReasoning;
    details += `<p><strong>Source Reputation:</strong> ${results.urlAnalysis.sourceReputation}</p>`;
    if (results.urlAnalysis.keyClaims?.length) {
      facts = `<div><h4 style="margin-bottom: 5px;">Key Claims:</h4><ul style="padding-left: 20px; margin-top: 0;">${formatList(results.urlAnalysis.keyClaims)}</ul></div>`;
    }
  }
  if (results.textAnalysis) {
    reasoning = results.textAnalysis.riskReasoning;
    if (results.textAnalysis.keyClaims?.length) {
      facts = `<div><h4 style="margin-bottom: 5px;">Key Claims:</h4><ul style="padding-left: 20px; margin-top: 0;">${formatList(results.textAnalysis.keyClaims)}</ul></div>`;
    }
  }
  if (results.imageAnalysis) {
    reasoning = results.imageAnalysis.riskReasoning;
    details += `<p><strong>Manipulation:</strong> ${results.imageAnalysis.manipulationAssessment}</p>`;
    if (results.imageAnalysis.description) {
      facts = `<div><h4 style="margin-bottom: 5px;">Content Description:</h4><p style="font-size: 13px; color: #555;">${results.imageAnalysis.description}</p></div>`;
    }
  }
  if (results.verification) {
    reasoning = results.verification.gdeltResults;
    details += `<p><strong>Verification:</strong> ${results.verification.gdeltResults}</p>`;
    if (results.context) {
      details += `<p><strong>Weather Match:</strong> ${results.context.weatherMatch ? "Yes" : "No"}</p>`;
    }
  }
  if (results.transcription) {
    facts += `<div><h4 style="margin-bottom: 5px;">Transcription:</h4><p style="font-size: 12px; color: #666; font-style: italic;">"${results.transcription.slice(0, 200)}${results.transcription.length > 200 ? '...' : ''}"</p></div>`;
  }

  let iconSvg = "";
  if (score > 50) {
    // Green Shield Check
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
  } else {
    // Red Shield Alert
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  }

  // Define border color for summary box based on score
  const summaryBorderColor = score > 50 ? "#22c55e" : "#ef4444";

  modalContent.innerHTML = `
    <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
      <div style="display: flex; align-items: center; justify-content: center;">
        ${iconSvg}
      </div>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h4 style="margin-bottom: 5px; font-size: 14px;">Analysis Summary:</h4>
      <p style="background: #f8f9fa; padding: 12px; border-radius: 6px; font-size: 14px; line-height: 1.5; border-left: 4px solid ${summaryBorderColor}; margin-top: 0;">${reasoning}</p>
    </div>

    ${facts ? `<div style="margin-bottom: 15px; border-top: 1px solid #eee; padding-top: 10px;">${facts}</div>` : ''}
    
    ${details ? `<div style="font-size: 13px; color: #666; border-top: 1px solid #eee; padding-top: 10px; margin-bottom: 15px;">${details}</div>` : ''}

    <div style="border-top: 1px solid #eee; padding-top: 15px;">
        ${results.aiDetection ? `
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">🤖 AI Probability</h4>
                <span style="font-weight: 800; color: ${results.aiDetection.aiProbability > 50 ? '#7e22ce' : '#15803d'}; font-size: 14px;">
                    ${results.aiDetection.aiProbability}%
                </span>
            </div>
            <p style="font-size: 11px; color: #666; margin-top: 5px; line-height: 1.4;">${results.aiDetection.reasoning.slice(0, 100)}...</p>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
             <h4 style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Was this helpful?</h4>
             <div style="display: flex; gap: 8px;">
                 <button id="unearth-vote-up" style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 4px 8px; cursor: pointer;">👍</button>
                 <button id="unearth-vote-down" style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 4px 8px; cursor: pointer;">👎</button>
             </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Language</h4>
            <select id="unearth-lang-select" style="font-size: 12px; padding: 2px 5px; border-radius: 4px; border: 1px solid #ccc;">
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Marathi">Marathi</option>
                <option value="Spanish">Spanish</option>
            </select>
        </div>
        <div id="unearth-translated-summary" style="display: none; background: #eef2ff; padding: 10px; border-radius: 4px; font-size: 13px; color: #333; margin-bottom: 10px;"></div>

        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #666; text-transform: uppercase;">Share Verified Report</h4>
        <div style="display: flex; gap: 8px;">
            <button id="unearth-share-x" style="flex: 1; background: #000; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">Share on X</button>
            <button id="unearth-share-fb" style="flex: 1; background: #1877F2; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">Facebook</button>
        </div>
        <div style="margin-top: 8px; display: flex; gap: 8px;">
             <button id="unearth-open-report" style="flex: 1; background: #4f46e5; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">Open Full Report</button>
             <button id="unearth-copy-link" style="width: 30px; background: #f0f0f0; color: #333; border: 1px solid #ccc; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;" title="Copy Link">🔗</button>
        </div>
    </div>
  `;

  // Add event listeners
  setTimeout(() => {
    const caption = results.generatedCaption || `Verified by Unearth. MIS Score: ${score}/100`;
    const reportUrl = results.reportUrl || "https://unearth.ai";
    const reportId = results.reportId;
    const encodedCaption = encodeURIComponent(caption);
    const encodedUrl = encodeURIComponent(reportUrl);

    // Share buttons
    document.getElementById('unearth-share-x').onclick = () => {
      window.open(`https://twitter.com/intent/tweet?text=${encodedCaption}&url=${encodedUrl}`, '_blank');
    };
    document.getElementById('unearth-share-fb').onclick = () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedCaption}`, '_blank');
    };

    // Open Report Button
    document.getElementById('unearth-open-report').onclick = () => {
      window.open(reportUrl, '_blank');
    };

    // Copy Link Button
    document.getElementById('unearth-copy-link').onclick = () => {
      navigator.clipboard.writeText(`${caption} ${reportUrl}`).then(() => {
        const btn = document.getElementById('unearth-copy-link');
        const originalText = btn.innerText;
        btn.innerText = "✓";
        setTimeout(() => btn.innerText = originalText, 2000);
      });
    };

    // Voting
    const handleVote = (vote) => {
      if (!reportId) return;
      chrome.runtime.sendMessage({
        action: "vote",
        payload: { reportId, vote }
      }, (response) => {
        if (response && response.success) {
          const btn = document.getElementById(vote === 'up' ? 'unearth-vote-up' : 'unearth-vote-down');
          btn.style.background = vote === 'up' ? '#dcfce7' : '#fee2e2';
          btn.style.borderColor = vote === 'up' ? '#22c55e' : '#ef4444';
        }
      });
    };
    document.getElementById('unearth-vote-up').onclick = () => handleVote('up');
    document.getElementById('unearth-vote-down').onclick = () => handleVote('down');

    // Language Selector
    const langSelect = document.getElementById('unearth-lang-select');
    const translatedDiv = document.getElementById('unearth-translated-summary');

    langSelect.onchange = async (e) => {
      const lang = e.target.value;
      if (lang === 'English') {
        translatedDiv.style.display = 'none';
        return;
      }

      translatedDiv.style.display = 'block';
      translatedDiv.innerText = 'Translating...';

      // Send message to background to handle translation (since content script can't call server actions directly easily)
      // Ideally we would use the background script to proxy this, but for now we'll assume we can't easily import the server action in extension context without a proper API route.
      // Wait, we have an API route! We should use it.
      // But the API route currently only handles 'analyze'. We need a 'translate' endpoint or update the analyze endpoint.
      // For this hackathon scope, let's assume we can't easily add a new route without restarting everything.
      // Actually, we can just display a message that full translation requires the web dashboard for now, OR we can try to use the existing analyze endpoint if we modified it.
      // Let's modify the API route to handle translation requests!

      chrome.runtime.sendMessage(
        {
          action: "translate",
          payload: { summary: reasoning, targetLanguage: lang }
        },
        (response) => {
          if (response && response.success) {
            translatedDiv.innerText = response.translatedSummary;
          } else {
            translatedDiv.innerText = "Translation failed. Please try on the website.";
          }
        }
      );
    };
  }, 100);
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
          console.log("Unearth Agent: Detected blob URL, attempting conversion:", analyzed.content);

          const handleFallback = () => {
            console.log("Unearth Agent: Fetch failed, attempting frame capture fallback.");
            if (analyzed.element && analyzed.element.tagName === 'VIDEO') {
              const frameData = captureVideoFrame(analyzed.element);
              if (frameData) {
                console.log("Unearth Agent: Frame capture successful, sending as image.");
                chrome.runtime.sendMessage(
                  {
                    action: "analyzeContent",
                    payload: { type: "image", dataUri: frameData },
                    origin: window.location.origin,
                  },
                  showResults
                );
                return;
              }
            }

            // If all else fails
            chrome.runtime.sendMessage(
              {
                action: "analyzeContent",
                payload: { type: "url", content: analyzed.content },
                origin: window.location.origin,
              },
              showResults
            );
          };

          fetchBlobUrlAsDataUri(analyzed.content).then((dataUri) => {
            if (!dataUri) {
              handleFallback();
              return;
            }

            // Determine if blob is image or video based on MIME type or analyzed.type
            const ct = dataUri.split(";")[0];
            let type = "video"; // Default to video if uncertain, as images usually have clear extensions
            if (ct.includes("image")) type = "image";

            console.log("Unearth Agent: Converted blob to data URI. Type:", type);

            chrome.runtime.sendMessage(
              {
                action: "analyzeContent",
                payload: { type: type, dataUri },
                origin: window.location.origin,
              },
              showResults
            );
          }).catch(() => handleFallback());
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
    if (video && video.src) return { type: "url", content: video.src, element: video };
    // Find the best image candidate (largest by area) to avoid selecting avatars or emojis
    const images = postElement.querySelectorAll("img[src], img[data-src], img[srcset]");
    let bestImage = null;
    let maxArea = 0;

    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const area = rect.width * rect.height;
      // Filter out small images (likely avatars, emojis, or UI icons)
      // 10,000 px^2 is roughly 100x100
      if (area > 10000 && area > maxArea) {
        maxArea = area;
        bestImage = img;
      }
    });

    if (bestImage) {
      let src =
        bestImage.getAttribute("src") ||
        bestImage.getAttribute("data-src") ||
        bestImage.getAttribute("srcset");
      if (src && src.includes(",")) {
        const parts = src.split(",").map((s) => s.trim());
        const last = parts[parts.length - 1].split(" ")[0];
        src = last;
      }
      if (src) return { type: "url", content: src, element: bestImage };
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

function captureVideoFrame(video) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  } catch (e) {
    console.error("Unearth Agent: Failed to capture video frame", e);
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
