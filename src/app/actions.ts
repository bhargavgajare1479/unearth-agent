
'use server';

import { anonymizeWhistleblowerIdentity, type AnonymizeWhistleblowerIdentityOutput } from '@/ai/flows/anonymize-whistleblower-identity';
import { assessMisinformationTrustScore, type AssessMisinformationTrustScoreOutput } from '@/ai/flows/assess-misinformation-trust-score';
import { detectRecycledFootage, type DetectRecycledFootageOutput } from '@/ai/flows/detect-recycled-footage';
import { verifyCrisisFootageContext, type VerifyCrisisFootageContextOutput } from '@/ai/flows/verify-crisis-footage-context';

type MockMetadata = {
  flags: string[];
};

type MockIntegrity = {
  videoStreamHash: string;
  audioStreamHash: string;
}

export type AnalysisResults = {
  anonymization?: AnonymizeWhistleblowerIdentityOutput;
  misScore?: AssessMisinformationTrustScoreOutput;
  verification?: DetectRecycledFootageOutput;
  context?: VerifyCrisisFootageContextOutput;
  metadata?: MockMetadata;
  integrity?: MockIntegrity;
};

export async function analyzeInput(input: { type: 'video' | 'audio' | 'image', dataUri: string } | { type: 'text' | 'url', content: string }): Promise<AnalysisResults> {
  // Mock data for features not implemented in provided Genkit flows
  const metadata: MockMetadata = {
    flags: [
      "Suspicious Handler Detected: VideoHandler (Typical of FFmpeg/Scripted generation)",
      "Invalid Creation Timestamp (Potential metadata stripping or synthetic generation)"
    ]
  };
  const integrity: MockIntegrity = {
    videoStreamHash: "d41d8cd98f00b204e9800998ecf8427e",
    audioStreamHash: "c4ca4238a0b923820dcc509a6f75849b"
  };

  if (input.type !== 'video') {
    // Return mock data for non-video inputs as flows are video-specific
    const misScoreResult = await assessMisinformationTrustScore({
      metadataIntegrity: 50,
      physicsMatch: 50,
      sourceCorroboration: 50
    });
    return { 
        misScore: misScoreResult,
        metadata: { flags: ["Analysis for this input type is in development."] },
        integrity: { videoStreamHash: 'N/A', audioStreamHash: 'N/A' }
    };
  }

  try {
    const videoDataUri = input.dataUri;
    // Run independent analyses in parallel
    const [anonymizationResult, verificationResult, contextResult] = await Promise.all([
      anonymizeWhistleblowerIdentity({ videoDataUri }),
      detectRecycledFootage({ videoDataUri, videoDescription: "A video of a protest.", audioTranscription: "People are shouting slogans." }),
      verifyCrisisFootageContext({ latitude: 34.0522, longitude: -118.2437, time: new Date().toISOString(), weatherDescription: "Clear sky" })
    ]);

    // Derive scores for MIS calculation based on analysis results
    const metadataIntegrity = metadata.flags.length > 0 ? 25 : 95;
    const physicsMatch = contextResult.weatherMatch ? 80 : 30;
    const sourceCorroboration = verificationResult.gdeltResults.toLowerCase().includes("no relevant events found") ? 40 : 85;

    // Calculate the final Misinformation Immunity Score
    const misScoreResult = await assessMisinformationTrustScore({
      metadataIntegrity,
      physicsMatch,
      sourceCorroboration
    });

    return {
      anonymization: anonymizationResult,
      misScore: misScoreResult,
      verification: verificationResult,
      context: contextResult,
      metadata,
      integrity
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    // On failure, we can return a result object with an error flag or partial data.
    // For this MVP, we'll rethrow to let the client handle it.
    throw new Error("Video analysis process failed.");
  }
}
