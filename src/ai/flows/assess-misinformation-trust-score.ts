'use server';
/**
 * @fileOverview A flow that assesses the misinformation trust score of a video.
 *
 * - assessMisinformationTrustScore - A function that handles the assessment of the misinformation trust score.
 * - AssessMisinformationTrustScoreInput - The input type for the assessMisinformationTrustScore function.
 * - AssessMisinformationTrustScoreOutput - The return type for the assessMisinformationTrustScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessMisinformationTrustScoreInputSchema = z.object({
  metadataIntegrity: z
    .number()
    .min(0)
    .max(100)
    .describe('The integrity score of the video metadata (0-100).'),
  physicsMatch: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'The score representing how well the video physics match the metadata claims (0-100).'
    ),
  sourceCorroboration: z
    .number()
    .min(0)
    .max(100)
    .describe('The score representing the source corroboration of the video (0-100).'),
});
export type AssessMisinformationTrustScoreInput = z.infer<typeof AssessMisinformationTrustScoreInputSchema>;

const AssessMisinformationTrustScoreOutputSchema = z.object({
  misinformationImmunityScore: z
    .number()
    .min(0)
    .max(100)
    .describe('The overall misinformation immunity score (0-100).'),
});
export type AssessMisinformationTrustScoreOutput = z.infer<typeof AssessMisinformationTrustScoreOutputSchema>;

export async function assessMisinformationTrustScore(
  input: AssessMisinformationTrustScoreInput
): Promise<AssessMisinformationTrustScoreOutput> {
  return assessMisinformationTrustScoreFlow(input);
}

const assessMisinformationTrustScoreFlow = ai.defineFlow(
  {
    name: 'assessMisinformationTrustScoreFlow',
    inputSchema: AssessMisinformationTrustScoreInputSchema,
    outputSchema: AssessMisinformationTrustScoreOutputSchema,
  },
  async input => {
    // Calculate the weighted average of the input scores.
    const misinformationImmunityScore = Math.round(
      input.metadataIntegrity * 0.3 + input.physicsMatch * 0.4 + input.sourceCorroboration * 0.3
    );

    return {
      misinformationImmunityScore,
    };
  }
);
