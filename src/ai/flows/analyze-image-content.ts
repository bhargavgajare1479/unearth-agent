'use server';
/**
 * @fileOverview A flow to analyze image content for misinformation.
 *
 * - analyzeImageContent - A function that handles the image content analysis process.
 * - AnalyzeImageContentInput - The input type for the analyzeImageContent function.
 * - AnalyzeImageContentOutput - The return type for the analyzeImageContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageContentInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeImageContentInput = z.infer<typeof AnalyzeImageContentInputSchema>;

const AnalyzeImageContentOutputSchema = z.object({
  description: z.string().describe('A detailed description of the image content.'),
  manipulationAssessment: z
    .string()
    .describe(
      'An assessment of the image for signs of digital manipulation (e.g., AI generation, Photoshop). Note any inconsistencies in lighting, shadows, or textures.'
    ),
  reverseImageSearchKeywords: z
    .array(z.string())
    .describe('A list of keywords suitable for performing a reverse image search to find the original context.'),
  misinformationRisk: z
    .enum(['Low', 'Medium', 'High'])
    .describe('The assessed risk of the image being used for misinformation.'),
  riskReasoning: z.string().describe('The reasoning behind the misinformation risk assessment.'),
});
export type AnalyzeImageContentOutput = z.infer<typeof AnalyzeImageContentOutputSchema>;

export async function analyzeImageContent(input: AnalyzeImageContentInput): Promise<AnalyzeImageContentOutput> {
  return analyzeImageContentFlow(input);
}

const analyzeImageContentPrompt = ai.definePrompt({
  name: 'analyzeImageContentPrompt',
  input: {schema: AnalyzeImageContentInputSchema},
  output: {schema: AnalyzeImageContentOutputSchema},
  prompt: `You are a digital forensics expert specializing in image analysis. Analyze the provided image.

  1.  **Describe the Image:** Provide a detailed description of what you see in the image.
  2.  **Assess for Manipulation:** Look for any signs of digital alteration, AI generation, or inconsistencies (e.g., strange lighting, unnatural textures, inconsistent shadows, illogical details).
  3.  **Generate Search Keywords:** Provide a list of 3-5 distinct keywords that would be effective for a reverse image search to find the image's origin or other contexts in which it has appeared.
  4.  **Assess Misinformation Risk:** Based on your analysis, assess the risk of this image being used to spread misinformation (Low, Medium, or High).
  5.  **Provide Reasoning:** Explain your risk assessment.

  Return your analysis in the specified JSON format.

  Image to analyze:
  ---
  {{media url=imageDataUri}}
  ---`,
});

const analyzeImageContentFlow = ai.defineFlow(
  {
    name: 'analyzeImageContentFlow',
    inputSchema: AnalyzeImageContentInputSchema,
    outputSchema: AnalyzeImageContentOutputSchema,
  },
  async input => {
    const {output} = await analyzeImageContentPrompt(input);
    return output!;
  }
);
