# Unearth Agent

Unearth Agent is a web-based, AI-powered forensic tool designed to combat misinformation. It allows users to submit various forms of media and content to get a detailed analysis and a "Misinformation Immunity Score," which rates the trustworthiness of the content.

The project consists of two main components:
1.  A **Next.js Web Application** that provides the main user interface for submitting and viewing analysis reports.
2.  A **Browser Extension** that allows users to run these analyses directly on social media websites.

## Core Technologies

-   **Framework**: **Next.js 15 (App Router)** for the web application, enabling a powerful combination of Server Components (for performance) and Client Components (for interactivity).
-   **Generative AI**: **Genkit**, a Google-built framework, orchestrates calls to Google's AI models (like Gemini) for all analysis tasks.
-   **UI**: **React** is used for building the user interface, with **ShadCN/UI** providing a library of pre-built, accessible, and themeable components.
-   **Styling**: **Tailwind CSS** is used for all styling, with a custom theme configured in `tailwind.config.ts` and `src/app/globals.css`.
-   **Schema & Validation**: **Zod** is used to define strict input and output schemas for the AI flows, ensuring reliable JSON-formatted results.
-   **Extension Bundling**: **Webpack** is configured to bundle the browser extension's source files into a browser-compatible format.

## Technical Architecture

### Web Application

The web app is the central hub where all analysis is orchestrated and displayed.

1.  **Frontend (`src/components/dashboard.tsx`)**: A Client Component (`'use client'`) built with React manages the user interface and state (e.g., file uploads, loading states). It uses the browser's `FileReader` API to convert uploaded files into Data URIs before sending them for analysis.

2.  **Server Actions (`src/app/actions.ts`)**: The `analyzeInput` function is a Next.js Server Action (`'use server'`) that acts as the bridge between the frontend and the AI backend. It securely runs on the server, receives content from the client, and orchestrates the analysis by calling the appropriate Genkit flows. It also contains the logic for calculating the final "Misinformation Immunity Score" from the AI results.

3.  **AI Engine (`src/ai/flows/`)**: This directory contains specialized Genkit "flows" for each analysis task. Each flow is a server-side function that defines a prompt and uses `zod` schemas to structure the output from the AI model.
    -   **Video/Image/Audio Analysis**: These flows use multimedia-capable models to transcribe audio, analyze image content for manipulation, and verify the context of video footage.
    -   **Text/URL Analysis**: These flows use language models to summarize content, evaluate source reputation, and identify key claims or biased language.

### Browser Extension

The browser extension takes the power of the Unearth Agent and applies it directly to social media feeds.

1.  **Manifest (`public/extension/manifest.json`)**: This is the core configuration file that tells the browser what the extension does, what permissions it needs, and which scripts to run.

2.  **Content Script (`src/extension/content.js`)**: This script is injected directly into social media pages. Its job is to find posts and add a "Fact Check" button. When clicked, it sends the post's content to the background script.

3.  **Background Script (`src/extension/background.js`)**: This script acts as the extension's central nervous system. It listens for messages from the content script and makes the call to the same `analyzeInput` Server Action used by the main web application. This reusability is key to the architecture.

4.  **Webpack Build (`webpack.config.js`)**: A custom Webpack configuration bundles the extension's scripts into the `public/extension` directory, preparing them for use in the browser.

## Getting Started

To run the web application locally:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

To build the browser extension files:

```bash
npm run build:extension
```

This will generate the necessary `content.js` and `background.js` files in the `public/extension` directory. You can then load this directory as an "unpacked extension" in your browser's extension management page.
