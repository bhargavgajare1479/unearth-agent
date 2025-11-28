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
} from '@/ai/flows/verify-crisis-footage-context';
import {analyzeUrlContent, type AnalyzeUrlContentOutput} from '@/ai/flows/analyze-url-content';
import {transcribeAudio} from '@/ai/flows/transcribe-audio';
import {analyzeTextContent, type AnalyzeTextContentOutput} from '@/ai/flows/analyze-text-content';
import {analyzeImageContent, type AnalyzeImageContentOutput} from '@/ai/flows/analyze-image-content';

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
};

export async function analyzeInput(
  input:
    | {type: 'video' | 'audio' | 'image'; dataUri: string}
    | {type: 'text' | 'url'; content: string}
): Promise<AnalysisResults> {
  const scoreMap = {Low: 85, Medium: 50, High: 15};

  if (input.type === 'url') {
    const urlAnalysisResult = await analyzeUrlContent({url: input.content});
    const misScoreResult = await assessMisinformationTrustScore({
      metadataIntegrity: 70, // Not applicable for URL, neutral score
      physicsMatch: 70, // Not applicable for URL, neutral score
      sourceCorroboration: scoreMap[urlAnalysisResult.misinformationRisk] || 50,
    });
    return {
      urlAnalysis: urlAnalysisResult,
      misScore: misScoreResult,
      metadata: {flags: [urlAnalysisResult.sourceReputation]},
      integrity: {videoStreamHash: 'N/A', audioStreamHash: 'N/A'},
    };
  }

  if (input.type === 'text') {
    const textAnalysisResult = await analyzeTextContent({content: input.content});
    const misScoreResult = await assessMisinformationTrustScore({
      metadataIntegrity: 70, // Not applicable for text, neutral score
      physicsMatch: 70, // Not applicable for text, neutral score
      sourceCorroboration: scoreMap[textAnalysisResult.misinformationRisk] || 50,
    });
    return {
      textAnalysis: textAnalysisResult,
      misScore: misScoreResult,
      metadata: {flags: ['No metadata for text input.']},
      integrity: {videoStreamHash: 'N/A', audioStreamHash: 'N/A'},
    };
  }

  if (input.type === 'audio') {
    const {transcription} = await transcribeAudio({audioDataUri: input.dataUri});
    const textAnalysisResult = await analyzeTextContent({content: transcription});
    const misScoreResult = await assessMisinformationTrustScore({
      metadataIntegrity: 60, // Lower confidence for pure audio
      physicsMatch: 60, // Not applicable for audio
      sourceCorroboration: scoreMap[textAnalysisResult.misinformationRisk] || 50,
    });
    return {
      textAnalysis: textAnalysisResult,
      misScore: misScoreResult,
      transcription: transcription,
      metadata: {flags: ['Audio-only analysis.']},
      integrity: {videoStreamHash: 'N/A', audioStreamHash: 'd41d8cd98f00b204e9800998ecf8427e'}, // Placeholder hash
    };
  }

  if (input.type === 'image') {
    const imageAnalysisResult = await analyzeImageContent({imageDataUri: input.dataUri});
    const misScoreResult = await assessMisinformationTrustScore({
      metadataIntegrity: 50, // Lower confidence for static images
      physicsMatch: 50, // Not applicable for images
      sourceCorroboration: scoreMap[imageAnalysisResult.misinformationRisk] || 50,
    });
    return {
      imageAnalysis: imageAnalysisResult,
      misScore: misScoreResult,
      metadata: {flags: [imageAnalysisResult.manipulationAssessment]},
      integrity: {videoStreamHash: 'c4ca4238a0b923820dcc509a6f75849b', audioStreamHash: 'N/A'}, // Placeholder hash
    };
  }

  if (input.type === 'video') {
    try {
      const videoDataUri = input.dataUri;
      const {transcription} = await transcribeAudio({audioDataUri: videoDataUri});
      
      const [anonymizationResult, verificationResult, contextResult] = await Promise.all([
        anonymizeWhistleblowerIdentity({videoDataUri}),
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
      ]);

      const metadataIntegrity = 50; // Placeholder until real metadata extraction is possible
      const physicsMatch = contextResult.weatherMatch ? 80 : 30;
      const sourceCorroboration = verificationResult.gdeltResults
        .toLowerCase()
        .includes('no relevant events found')
        ? 40
        : 85;

      const misScoreResult = await assessMisinformationTrustScore({
        metadataIntegrity,
        physicsMatch,
        sourceCorroboration,
      });

      return {
        anonymization: anonymizationResult,
        misScore: misScoreResult,
        verification: verificationResult,
        context: contextResult,
        transcription: transcription,
        metadata: { flags: ['No real metadata flags implemented.'] },
        integrity: { videoStreamHash: verificationResult.perceptualHash, audioStreamHash: "d41d8cd98f00b204e9800998ecf8427e" }, // Using pHash for video
      };
    } catch (error) {
      console.error('Analysis failed:', error);
      throw new Error('Video analysis process failed.');
    }
  }

  // Fallback for any unhandled cases
  return {};
}
