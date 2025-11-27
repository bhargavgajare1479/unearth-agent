# **App Name**: Unearth Agent

## Core Features:

- Crisis-Context Mismatch Engine: Extracts metadata from video, calculates solar azimuth/altitude, detects visual weather using ViT, and cross-references with OpenWeatherMap API to verify the video's claims.
- "Voice of the Internet" Cross-Verification: Generates a perceptual hash of the video to find near-duplicates and detect recycled footage. Extracts keywords/entities (NER) from video description/audio and queries global news databases (GDELT) to see if the event is reported by trusted sources. This will be used as a tool during MIS.
- User Anonymization Preview: Allows whistleblowers to preview how their identity will be masked before submission by detecting faces, performing identity swapping using a pre-trained ONNX model, transcribing audio, and re-synthesizing it using a generic voice.
- Metadata Extraction: Extracts hidden traces of editing software and establishes a content-only fingerprint using ffprobe and binary parsing to find atom anomalies.
- File Integrity Verification: Generate an md5 hash for the audio and video stream
- Misinformation Immunity Score: Aggregates findings into a single trust score (0-100) based on a weighted average of metadata integrity, physics match, and source corroboration. Uses previous steps as a tool
- Interactive Dashboard: Show the results of the analysis in an interactive way using a UI in Streamlit

## Style Guidelines:

- Primary color: Dark forest green (#386641). Evokes feelings of trust and reliability, fitting for forensics.
- Background color: Very light desaturated green (#F0F5F1) creates a clean backdrop for data presentation.
- Accent color: Rusty orange (#A75D5D) adds a touch of visual interest for important indicators.
- Headline font: 'Space Grotesk' sans-serif, gives a scientific and technical feel.
- Body font: 'Inter' sans-serif, gives a clean and readable look for documentation or longer texts.
- Code font: 'Source Code Pro', this monospaced font is ideal for the presentation of extracted metadata or digital hashes.
- Use simple, clear icons to represent different data streams and analysis results.