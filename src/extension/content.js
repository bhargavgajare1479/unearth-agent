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
  modalContent.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px;">
      <div style="width: 100%; max-width: 240px; background-color: #f3f4f6; border-radius: 9999px; height: 6px; overflow: hidden; margin-bottom: 20px;">
        <div id="unearth-progress-bar" style="width: 0%; height: 100%; background-color: #10b981; transition: width 0.5s ease;"></div>
      </div>
      <p style="color: #4b5563; font-size: 14px; font-weight: 500; margin: 0;">Analyzing content...</p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 5px;">This may take a few seconds</p>
    </div>
  `;
  
  // Simulate progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 90) progress = 90;
    const bar = document.getElementById('unearth-progress-bar');
    if (bar) bar.style.width = `${progress}%`;
    else clearInterval(interval);
  }, 500);
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
  const summaryColor = score > 50 ? "#22c55e" : "#ef4444";
  const summaryBg = score > 50 ? "#f0fdf4" : "#fef2f2";

  modalContent.innerHTML = `
    <div style="text-align: center; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid #f3f4f6;">
      <div style="display: inline-flex; align-items: center; justify-content: center; padding: 12px; background: ${summaryBg}; border-radius: 50%; margin-bottom: 12px;">
        ${iconSvg}
      </div>
      <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">
        ${score > 50 ? "Likely Authentic" : "Potential Misinformation"}
      </h3>
      <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">
        Immunity Score: <span style="font-weight: 700; color: ${summaryColor}">${score}/100</span>
      </p>
    </div>
    
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Analysis Summary</h4>
      <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0;">${reasoning}</p>
    </div>

    ${facts ? `
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      ${facts}
    </div>` : ''}
    
    ${details ? `
    <div style="background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 13px; color: #4b5563;">
      ${details}
    </div>` : ''}

    <div style="border-top: 1px solid #f3f4f6; padding-top: 20px;">
        ${results.aiDetection ? `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">AI Probability</h4>
                <span style="font-weight: 700; color: ${results.aiDetection.aiProbability > 50 ? '#7e22ce' : '#15803d'}; font-size: 14px;">
                    ${results.aiDetection.aiProbability}%
                </span>
            </div>
            <div style="width: 100%; background: #f3f4f6; height: 6px; border-radius: 99px; overflow: hidden;">
                <div style="width: ${results.aiDetection.aiProbability}%; background: ${results.aiDetection.aiProbability > 50 ? '#a855f7' : '#22c55e'}; height: 100%;"></div>
            </div>
            <p style="font-size: 11px; color: #6b7280; margin-top: 6px; line-height: 1.4;">${results.aiDetection.reasoning.slice(0, 100)}...</p>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
             <h4 style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280;">Was this helpful?</h4>
             <div style="display: flex; gap: 8px;">
                 <button id="unearth-vote-up" style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px; cursor: pointer; transition: all 0.2s;">👍</button>
                 <button id="unearth-vote-down" style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px; cursor: pointer; transition: all 0.2s;">👎</button>
             </div>
        </div>

        <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280;">Language</h4>
                <select id="unearth-lang-select" style="font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid #d1d5db; background: white; cursor: pointer;">
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Spanish">Spanish</option>
                </select>
            </div>
            <div id="unearth-translated-summary" style="display: none; background: #eff6ff; padding: 12px; border-radius: 8px; font-size: 13px; color: #1e40af; line-height: 1.5;"></div>
        </div>

        <div style="display: flex; gap: 10px;">
            <button id="unearth-open-report" style="flex: 1; background: #4f46e5; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.2s;">View Full Report</button>
            <button id="unearth-share-x" style="background: #000; color: white; border: none; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;">𝕏</button>
            <button id="unearth-copy-link" style="background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;" title="Copy Link">🔗</button>
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
    background-color: #10b981; /* Emerald 500 */
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: auto; /* Ensure it's not full width */
  `;
  button.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    Fact Check
  `;
  button.onmouseover = () => {
    button.style.transform = "translateY(-1px)";
    button.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
  };
  button.onmouseout = () => {
    button.style.transform = "translateY(0)";
    button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
  };

  button.onclick = async (e) => {
    e.stopPropagation(); // Prevent navigating to the tweet when clicking the button
    e.preventDefault();

    showLoading();
    let payload = null;

    // Try to find different types of content within the post
    // The querySelector for images on Twitter/X can be tricky. This is a more robust selector.
    const image = postElement.querySelector('img[alt][src*="pbs.twimg.com/media"]');
    const video = postElement.querySelector('video');
    const postTextElement = postElement.querySelector('[data-testid="tweetText"]'); 

    if (video && video.src) {
        payload = { type: 'url', content: video.src };
    } else if (image && image.src) {
        // Send the image URL to the background script for processing.
        // This avoids CORS issues in the content script.
        payload = { type: 'image', content: image.src };
    } else if (postTextElement && postTextElement.innerText) {
        payload = { type: 'text', content: postTextElement.innerText };
    }

    if (payload) {
      chrome.runtime.sendMessage({ action: 'analyzeContent', payload }, showResults);
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

console.log('Unearth Agent content script loaded and observing.');
