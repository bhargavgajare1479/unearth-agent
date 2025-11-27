'use server';

/**
 * @fileOverview Detects recycled footage by generating a perceptual hash of the video,
 * extracts keywords/entities, and queries global news databases.
 *
 * @remarks
 * - detectRecycledFootage - A function that orchestrates the process of detecting recycled footage.
 * - DetectRecycledFootageInput - The input type for the detectRecycledFootage function.
 * - DetectRecycledFootageOutput - The return type for the detectRecycledFootage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const DetectRecycledFootageInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  videoDescription: z.string().describe('The description of the video.'),
  audioTranscription: z.string().describe('The transcription of the video audio.'),
});
export type DetectRecycledFootageInput = z.infer<typeof DetectRecycledFootageInputSchema>;

const DetectRecycledFootageOutputSchema = z.object({
  perceptualHash: z.string().describe('The perceptual hash (pHash) of the video.'),
  extractedKeywords: z.array(z.string()).describe('Keywords and entities extracted from the video description and audio.'),
  gdeltResults: z.string().describe('Summary of results from querying GDELT with extracted keywords.'),
});
export type DetectRecycledFootageOutput = z.infer<typeof DetectRecycledFootageOutputSchema>;

export async function detectRecycledFootage(input: DetectRecycledFootageInput): Promise<DetectRecycledFootageOutput> {
  return detectRecycledFootageFlow(input);
}

const detectRecycledFootagePrompt = ai.definePrompt({
  name: 'detectRecycledFootagePrompt',
  input: {schema: DetectRecycledFootageInputSchema},
  output: {schema: DetectRecycledFootageOutputSchema},
  prompt: `You are an expert in digital forensics, tasked with analyzing a video to detect if it is recycled or contains misinformation.

  Generate a perceptual hash of the video to find near-duplicates and detect recycled footage. Extract keywords and entities (NER) from the video description and audio transcription.  Query global news databases (GDELT) to see if the event is reported by trusted sources.

  Video Description: {{{videoDescription}}}
  Audio Transcription: {{{audioTranscription}}}
  Video Data: {{media url=videoDataUri}}

  Return the perceptual hash, extracted keywords, and a summary of GDELT results.
  `,
});

const detectRecycledFootageFlow = ai.defineFlow(
  {
    name: 'detectRecycledFootageFlow',
    inputSchema: DetectRecycledFootageInputSchema,
    outputSchema: DetectRecycledFootageOutputSchema,
  },
  async input => {
    const {output} = await detectRecycledFootagePrompt(input);
    return output!;
  }
);
