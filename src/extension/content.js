// This script is injected into social media pages.
// It will be responsible for finding posts and adding the "Fact Check" button.

// --- UI & MODAL ---

function createModal() {
  const modal = document.createElement('div');
  modal.id = 'unearth-agent-modal';
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

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 15px;
  `;

  const title = document.createElement('h2');
  title.textContent = 'Unearth Agent Analysis';
  title.style.margin = '0';
  title.style.fontSize = '18px';

  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    border: none;
    background: transparent;
    font-size: 24px;
    cursor: pointer;
  `;
  closeButton.onclick = () => (modal.style.display = 'none');

  header.appendChild(title);
  header.appendChild(closeButton);

  const content = document.createElement('div');
  content.id = 'unearth-agent-modal-content';
  content.style.overflowY = 'auto';

  modal.appendChild(header);
  modal.appendChild(content);

  document.body.appendChild(modal);
  return modal;
}

const modal = createModal();
const modalContent = document.getElementById('unearth-agent-modal-content');

function showLoading() {
  modal.style.display = 'flex';
  modalContent.innerHTML = `<p style="text-align: center;">Analyzing... This may take a moment.</p>`;
}

function showResults(data) {
  if (!data.success) {
    modalContent.innerHTML = `<p style="color: red; font-weight: bold;">Analysis Failed</p><p>${data.error || 'An unknown error occurred.'}</p>`;
    return;
  }

  const results = data.results;
  const score = results.misScore?.misinformationImmunityScore ?? 'N/A';
  let reasoning = 'No detailed analysis available.';
  if (results.urlAnalysis) reasoning = results.urlAnalysis.riskReasoning;
  if (results.textAnalysis) reasoning = results.textAnalysis.riskReasoning;
  if (results.imageAnalysis) reasoning = results.imageAnalysis.riskReasoning;
  if (results.verification) reasoning = results.verification.gdeltResults;

  let scoreColor = '#333';
  if (score > 75) scoreColor = '#22c55e'; // green
  else if (score > 40) scoreColor = '#f59e0b'; // amber
  else if (score !== 'N/A') scoreColor = '#ef4444'; // red
  

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

function createFactCheckButton(postElement) {
  const button = document.createElement('button');
  button.innerText = 'Fact Check';
  button.className = 'unearth-agent-button'; // Add a class for styling and to avoid re-adding
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
  button.onmouseover = () => (button.style.opacity = '1');
  button.onmouseout = () => (button.style.opacity = '0.8');

  button.onclick = async (e) => {
    e.stopPropagation(); // Prevent navigating to the tweet when clicking the button
    e.preventDefault();

    showLoading();
    let payload = null;

    // Try to find different types of content within the post
    const image = postElement.querySelector('img[alt="Image"]');
    const video = postElement.querySelector('video');
    // Twitter/X specific selector for the main text content
    const postTextElement = postElement.querySelector('[data-testid="tweetText"]'); 

    if (video && video.src) {
        // Can't read video content directly. Best we can do is send the URL.
        // In a real-world scenario, this is a limitation. Our app can handle it if the URL is public.
         payload = { type: 'url', content: video.src };
    } else if (image && image.src) {
        // We can't analyze external images directly due to CORS.
        // We'll treat it as a URL analysis. The backend can fetch it.
        payload = { type: 'url', content: image.src };
    } else if (postTextElement && postTextElement.innerText) {
        payload = { type: 'text', content: postTextElement.innerText };
    }

    if (payload) {
      chrome.runtime.sendMessage({ action: 'analyzeContent', payload, origin: window.location.origin }, showResults);
    } else {
      showResults({ success: false, error: "Couldn't find analyzable content (text, image, or video) in this post." });
    }
  };

  return button;
}

// Function to find and add buttons to posts
function addButtonsToPosts() {
  // Use a more specific selector for Twitter/X articles to avoid adding buttons to unrelated elements
  const posts = document.querySelectorAll('article[data-testid="tweet"]');

  posts.forEach(post => {
    // Check if we've already added a button to this post
    if (post.querySelector('.unearth-agent-button')) {
      return;
    }

    const button = createFactCheckButton(post);
    
    // Find the action bar (where reply, like, etc. buttons are)
    const actionBar = post.querySelector('div[role="group"]');
    if (actionBar) {
        // Prepend our button to the action bar for better placement
        actionBar.parentElement.appendChild(button);
    } else {
        // Fallback to just appending to the post if the action bar isn't found
        post.appendChild(button);
    }
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
