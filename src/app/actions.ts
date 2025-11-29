'use server';

import {
  anonymizeWhistleblowerIdentity,
  type AnonymizeWhistleblowerIdentityOutput,
} from '@/ai/flows/anonymize-whistleblower-identity';
import {
  assessMisinformationTrustScore,
  type AssessMisinformationTrustScoreOutput,
} from '@/ai/flows/assess-misinformation-trust-score';
import {
  detectRecycledFootage,
  type DetectRecycledFootageOutput,
} from '@/ai/flows/detect-recycled-footage';
import {
  verifyCrisisFootageContext,
  type VerifyCrisisFootageContextOutput,
}
  from '@/ai/flows/verify-crisis-footage-context';
import { analyzeUrlContent, type AnalyzeUrlContentOutput } from '@/ai/flows/analyze-url-content';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { analyzeTextContent, type AnalyzeTextContentOutput } from '@/ai/flows/analyze-text-content';
import { analyzeImageContent, type AnalyzeImageContentOutput } from '@/ai/flows/analyze-image-content';
import { translateSummary, type TranslateSummaryInput, type TranslateSummaryOutput } from '@/ai/flows/translate-summary';
import { detectAiGeneration, type DetectAiGenerationOutput } from '@/ai/flows/detect-ai-generation';

export { translateSummary };

type Metadata = {
  flags: string[];
};

type Integrity = {
  videoStreamHash: string;
  audioStreamHash: string;
};

export type AnalysisResults = {
  anonymization?: AnonymizeWhistleblowerIdentityOutput;
  misScore?: AssessMisinformationTrustScoreOutput;
  verification?: DetectRecycledFootageOutput;
  context?: VerifyCrisisFootageContextOutput;
  metadata?: Metadata;
  integrity?: Integrity;
  urlAnalysis?: AnalyzeUrlContentOutput;
  textAnalysis?: AnalyzeTextContentOutput;
  imageAnalysis?: AnalyzeImageContentOutput;
  transcription?: string;
  generatedCaption?: string;
  reportId?: string;
  reportUrl?: string;
  aiDetection?: DetectAiGenerationOutput;
  votes?: { up: number; down: number };
};

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// File path for persistent storage
const DB_PATH = path.join(process.cwd(), 'reports.json');

// Helper to generate content hash
function generateContentHash(input: { type: string; content?: string; dataUri?: string }): string {
  const data = input.content || input.dataUri || '';
  return crypto.createHash('sha256').update(input.type + ':' + data).digest('hex');
}

// Helper to read DB
function readDb(): {
  reports: Record<string, AnalysisResults>,
  votes: Record<string, { up: number, down: number }>,
  cache: Record<string, string>
} {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { reports: {}, votes: {}, cache: {} };
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      reports: parsed.reports || {},
      votes: parsed.votes || {},
      cache: parsed.cache || {}
    };
  } catch (error) {
    console.error('Error reading DB:', error);
    return { reports: {}, votes: {}, cache: {} };
  }
}

// Helper to write DB
function writeDb(data: {
  reports: Record<string, AnalysisResults>,
  votes: Record<string, { up: number, down: number }>,
  cache: Record<string, string>
}) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

// ... (getReport, voteOnReport)



export async function getReport(id: string): Promise<AnalysisResults | undefined> {
  const db = readDb();
  const report = db.reports[id];
  if (report) {
    const votes = db.votes[id] || { up: 0, down: 0 };
    return { ...report, votes };
  }
  return undefined;
}

export async function voteOnReport(reportId: string, vote: 'up' | 'down') {
  const db = readDb();
  const current = db.votes[reportId] || { up: 0, down: 0 };

  if (vote === 'up') current.up++;
  else current.down++;

  db.votes[reportId] = current;
  writeDb(db);

  return current;
}

function generateCaption(score: number, summary: string, aiProb?: number): string {
  const prefix = `MIS ${score}/100 — `;
  let suffix = ` Verified by Unearth.`;
  if (aiProb && aiProb > 80) {
    suffix = ` 🤖 High AI Probability (${aiProb}%).` + suffix;
  }

  // Target 250 chars max
  const maxSummaryLength = 250 - prefix.length - suffix.length;

  let truncatedSummary = summary;
  if (summary.length > maxSummaryLength) {
    truncatedSummary = summary.slice(0, maxSummaryLength - 1) + '…';
  }

  return `${prefix}${truncatedSummary}${suffix}`;
}

// Helper to extract AI metadata
function extractAiMetadata(dataUri: string): string {
  try {
    // Decode base64 to buffer (first 4KB is usually enough for headers)
    const base64Data = dataUri.split(',')[1];
    if (!base64Data) return "No data found.";

    const buffer = Buffer.from(base64Data, 'base64');
    const header = buffer.subarray(0, 4096).toString('utf-8'); // Convert to string to search for text tags

    const keywords = [
      "Midjourney", "DALL-E", "Stable Diffusion", "Adobe Firefly", "AI Generated",
      "c2pa", "DreamStudio", "Bing Image Creator"
    ];

    const found = keywords.filter(k => header.includes(k));

    if (found.length > 0) {
      return `Found potential AI signatures in file metadata: ${found.join(', ')}.`;
    }
    return "No obvious AI signatures found in file header.";
  } catch (e) {
    return "Could not read metadata.";
  }
}

export async function analyzeInput(
  input:
    | { type: 'video' | 'audio' | 'image'; dataUri: string }
    | { type: 'text' | 'url'; content: string }
): Promise<AnalysisResults> {

  // 1. Check Cache
  const contentHash = generateContentHash(input);
  const db = readDb();

  if (db.cache[contentHash]) {
    const cachedReportId = db.cache[contentHash];
    const cachedReport = db.reports[cachedReportId];
    if (cachedReport) {
      console.log(`Cache Hit! Returning report ${cachedReportId}`);
      // Return cached report with current votes
      const votes = db.votes[cachedReportId] || { up: 0, down: 0 };
      return { ...cachedReport, votes };
    }
  }

  console.log(`Cache Miss. Analyzing content...`);

  const scoreMap = { Low: 85, Medium: 50, High: 15 };
  let results: AnalysisResults = {};

  if (input.type === 'url') {
    const urlAnalysisResult = await analyzeUrlContent({ url: input.content });
    const misScoreResult = await assessMisinformationTrustScore({
      metadataIntegrity: 75, // Neutral score, as no file metadata is available.
      physicsMatch: 75, // Not applicable for URLs.
      sourceCorroboration: scoreMap[urlAnalysisResult.misinformationRisk] || 50,
    });
    const caption = generateCaption(misScoreResult.misinformationImmunityScore, urlAnalysisResult.summary);
    results = {
      urlAnalysis: urlAnalysisResult,
      misScore: misScoreResult,
      metadata: { flags: [urlAnalysisResult.sourceReputation] },
      integrity: { videoStreamHash: 'N/A', audioStreamHash: 'N/A' },
      generatedCaption: caption,
    };
  }

  else if (input.type === 'text') {
    const textAnalysisResult = await analyzeTextContent({ content: input.content });
    const aiDetectionResult = await detectAiGeneration({ text: input.content });

    const misScoreResult = await assessMisinformationTrustScore({
      metadataIntegrity: aiDetectionResult.aiProbability > 80 ? 20 : 80,
      physicsMatch: 80, // Not applicable for text.
      sourceCorroboration: scoreMap[textAnalysisResult.misinformationRisk] || 50,
    });
    const caption = generateCaption(misScoreResult.misinformationImmunityScore, textAnalysisResult.summary, aiDetectionResult.aiProbability);
    results = {
      textAnalysis: textAnalysisResult,
      misScore: misScoreResult,
      metadata: { flags: ['No metadata for text input.'] },
      integrity: { videoStreamHash: 'N/A', audioStreamHash: 'N/A' },
      generatedCaption: caption,
      aiDetection: aiDetectionResult,
    };
  }

  else if (input.type === 'audio') {
    const { transcription } = await transcribeAudio({ audioDataUri: input.dataUri });
    const textAnalysisResult = await analyzeTextContent({ content: transcription });
    const misScoreResult = await assessMisinformationTrustScore({
      metadataIntegrity: 65, // Lower confidence for pure audio as visual context is missing.
      physicsMatch: 75, // Not applicable for audio.
      sourceCorroboration: scoreMap[textAnalysisResult.misinformationRisk] || 50,
    });
    const caption = generateCaption(misScoreResult.misinformationImmunityScore, textAnalysisResult.summary);
    results = {
      textAnalysis: textAnalysisResult,
      misScore: misScoreResult,
      transcription: transcription,
      metadata: { flags: ['Audio-only analysis. Context may be limited.'] },
      integrity: { videoStreamHash: 'N/A', audioStreamHash: 'd41d8cd98f00b204e9800998ecf8427e' },
      generatedCaption: caption,
    };
  }

  else if (input.type === 'image') {
    try {
      const imageAnalysisResult = await analyzeImageContent({ imageDataUri: input.dataUri });
      const metadataInfo = extractAiMetadata(input.dataUri);
      const aiDetectionResult = await detectAiGeneration({ dataUri: input.dataUri, metadataInfo });

      const manipulationScore = imageAnalysisResult.manipulationAssessment.toLowerCase().includes('no obvious signs') ? 85 : 35;
      // Factor in AI probability to integrity score
      const finalIntegrity = aiDetectionResult.aiProbability > 80 ? 10 : manipulationScore;

      const misScoreResult = await assessMisinformationTrustScore({
        metadataIntegrity: finalIntegrity,
        physicsMatch: 75, // Not applicable for static images in this context.
        sourceCorroboration: scoreMap[imageAnalysisResult.misinformationRisk] || 50,
      });
      const caption = generateCaption(misScoreResult.misinformationImmunityScore, imageAnalysisResult.description, aiDetectionResult.aiProbability);
      results = {
        imageAnalysis: imageAnalysisResult,
        misScore: misScoreResult,
        metadata: { flags: [imageAnalysisResult.manipulationAssessment, metadataInfo] },
        integrity: { videoStreamHash: 'c4ca4238a0b923820dcc509a6f75849b', audioStreamHash: 'N/A' },
        generatedCaption: caption,
        aiDetection: aiDetectionResult,
      };
    } catch (error) {
      console.error('Image Analysis failed:', error);
      throw new Error('Image analysis process failed.');
    }
  }

  else if (input.type === 'video') {
    try {
      const videoDataUri = input.dataUri;
      const { transcription } = await transcribeAudio({ audioDataUri: videoDataUri });
      const metadataInfo = extractAiMetadata(input.dataUri);

      const [anonymizationResult, verificationResult, contextResult, aiDetectionResult] = await Promise.all([
        anonymizeWhistleblowerIdentity({ videoDataUri }),
        detectRecycledFootage({
          videoDataUri,
          videoDescription: 'A video from user upload.',
          audioTranscription: transcription,
        }),
        verifyCrisisFootageContext({
          latitude: 34.0522, // Placeholder location
          longitude: -118.2437, // Placeholder location
          time: new Date().toISOString(),
          weatherDescription: 'Clear sky', // Placeholder weather
        }),
        detectAiGeneration({ dataUri: videoDataUri, metadataInfo }),
      ]);

      // Calculate scores based on analysis results
      const metadataIntegrity = verificationResult.gdeltResults.toLowerCase().includes('no relevant events found') ? 60 : 85;
      const physicsMatch = contextResult.weatherMatch ? 90 : 40;
      const sourceCorroboration = verificationResult.gdeltResults.toLowerCase().includes('no relevant events found') ? 40 : 90;

      // Penalize for high AI probability
      const adjustedIntegrity = aiDetectionResult.aiProbability > 80 ? 10 : metadataIntegrity;

      const misScoreResult = await assessMisinformationTrustScore({
        metadataIntegrity: adjustedIntegrity,
        physicsMatch,
        sourceCorroboration,
      });

      const caption = generateCaption(misScoreResult.misinformationImmunityScore, `Video analysis: ${verificationResult.gdeltResults}`, aiDetectionResult.aiProbability);

      results = {
        anonymization: anonymizationResult,
        misScore: misScoreResult,
        verification: verificationResult,
        context: contextResult,
        transcription: transcription,
        metadata: { flags: ['Video analysis completed.'] },
        integrity: { videoStreamHash: verificationResult.perceptualHash, audioStreamHash: "d41d8cd98f00b204e9800998ecf8427e" },
        generatedCaption: caption,
        aiDetection: aiDetectionResult,
      };
    } catch (error) {
      console.error('Video Analysis failed:', error);
      throw new Error('Video analysis process failed.');
    }
  }

  // Store the report
  if (Object.keys(results).length > 0) {
    const reportId = crypto.randomUUID();
    // In a real app, use the actual domain. For local dev, we assume localhost:9002
    const reportUrl = `http://localhost:9002/report/${reportId}`;
    results.reportId = reportId;
    results.reportUrl = reportUrl;

    const db = readDb();
    db.reports[reportId] = results;
    db.cache[contentHash] = reportId; // Update cache
    writeDb(db);
  }

  return results;
}
