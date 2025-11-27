'use server';

/**
 * @fileOverview Verifies if the video's physical reality (sun, weather) matches its metadata claims.
 *
 * - verifyCrisisFootageContext - A function that handles the crisis footage verification process.
 * - VerifyCrisisFootageContextInput - The input type for the verifyCrisisFootageContext function.
 * - VerifyCrisisFootageContextOutput - The return type for the verifyCrisisFootageContext function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyCrisisFootageContextInputSchema = z.object({
  latitude: z.number().describe('Latitude from the video metadata.'),
  longitude: z.number().describe('Longitude from the video metadata.'),
  time: z.string().describe('Time from the video metadata in ISO format.'),
  weatherDescription: z.string().describe('The description of the weather from the video.'),
});
export type VerifyCrisisFootageContextInput = z.infer<
  typeof VerifyCrisisFootageContextInputSchema
>;

const VerifyCrisisFootageContextOutputSchema = z.object({
  solarAzimuth: z
    .number()
    .describe('The calculated solar azimuth based on the metadata.'),
  solarAltitude: z
    .number()
    .describe('The calculated solar altitude based on the metadata.'),
  weatherMatch: z
    .boolean()
    .describe(
      'Whether the visual weather detected in the video matches the weather from the OpenWeatherMap API.'
    ),
  mismatchReason: z
    .string()
    .optional()
    .describe(
      'If there is a weather mismatch, this describes the possible reason for the mismatch.'
    ),
});
export type VerifyCrisisFootageContextOutput = z.infer<
  typeof VerifyCrisisFootageContextOutputSchema
>;

export async function verifyCrisisFootageContext(
  input: VerifyCrisisFootageContextInput
): Promise<VerifyCrisisFootageContextOutput> {
  return verifyCrisisFootageContextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyCrisisFootageContextPrompt',
  input: {schema: VerifyCrisisFootageContextInputSchema},
  output: {schema: VerifyCrisisFootageContextOutputSchema},
  prompt: `You are an expert in verifying crisis footage context.

You will be provided with the latitude, longitude, time, and weather description from the video.

Based on this information, you will calculate the theoretical solar azimuth and altitude.

You will also determine whether the visual weather detected in the video matches the expected weather from the OpenWeatherMap API for the given location and time.

If there is a mismatch, provide a possible reason for the mismatch.

Latitude: {{latitude}}
Longitude: {{longitude}}
Time: {{time}}
Weather Description: {{weatherDescription}}`,
});

const verifyCrisisFootageContextFlow = ai.defineFlow(
  {
    name: 'verifyCrisisFootageContextFlow',
    inputSchema: VerifyCrisisFootageContextInputSchema,
    outputSchema: VerifyCrisisFootageContextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
