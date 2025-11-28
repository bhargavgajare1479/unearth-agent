# Unearth Agent - Browser Extension

This folder contains the browser extension code used by the Unearth Agent. The content script injects a "Fact Check" button into posts on social platforms and article pages.

## Recent updates

- Added Facebook/Instagram and generic article page support for `Fact Check` button.
- Added `<all_urls>` host permission and `all_frames` to content script so the script runs on many news sites and nested frames.
- Implemented helper functions to detect the site type, collect candidate posts, and extract analyzable content (image, video, text).

## How to test locally

1. Build the site if you have a build step (or use the files in the `public/extension` directory directly).
2. Open a Chromium-based browser (Chrome, Edge).
3. Open `chrome://extensions/` and enable `Developer mode`.
4. Click `Load unpacked` and select `public/extension`.
5. Make sure the extension is installed and active.
6. Visit supported sites to verify the `Fact Check` button appears:
   - https://x.com, https://twitter.com
   - https://instagram.com
   - https://facebook.com
   - Any news site with `article` tags (e.g., https://www.bbc.com/news)

## Troubleshooting & Notes

- The `Fact Check` button is inserted into elements that appear to contain images, video, or text. If the site uses highly custom DOM or shadow DOM, it might not be detectable; open an issue with site-specific selectors so we can add robust support.
- For Facebook and Instagram, posts are often loaded dynamically; our script uses a MutationObserver to handle newly loaded posts.
- If the `Fact Check` button doesn't appear on a specific site, try opening the browser devtools and check for errors under `Console` to see that the content script runs and isn't blocked.
- The extension communicates with a backend running at `http://localhost:9002/api/analyze` to process images and text; ensure that server is running and accessible.
- The extension communicates with a backend running at `http://localhost:9002/api/analyze` to process images and text; ensure that server is running and accessible.
- If the server returns a `403 Forbidden` when trying to fetch images hosted behind login or access controls, the extension will now try to fetch the media via the extension's background service worker (which includes page credentials) and convert it to a data URI. This allows the backend flows (image/video/audio analysis) to run even for media that is not directly accessible by the server.

## Privacy and permissions

- The extension requires host access to many websites; if you want to restrict permissions, remove `<all_urls>` from `manifest.json` and add site-specific entries.
- Requests to analyze content are sent to the local analysis server; no data is stored by the extension itself.

## Contributing

- Add additional site-specific selectors and placement tweaks in `src/extension/content.js` to improve button placement for complex websites (e.g., Instagram Reels, Facebook stories, or paywalled news articles).
- Run tests by installing the unpacked extension as above and verifying the behavior.
