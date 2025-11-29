'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectAiGenerationInputSchema = z.object({
    dataUri: z.string().optional().describe('The image or video frame to analyze.'),
    text: z.string().optional().describe('The text content to analyze.'),
});

export type DetectAiGenerationInput = z.infer<typeof DetectAiGenerationInputSchema>;

const DetectAiGenerationOutputSchema = z.object({
    aiProbability: z.number().describe('Probability score from 0 to 100 that the content is AI-generated.'),
    reasoning: z.string().describe('Explanation for the score.'),
    artifactsFound: z.array(z.string()).describe('List of specific AI artifacts detected (e.g., "distorted hands", "unnatural lighting").'),
});

export type DetectAiGenerationOutput = z.infer<typeof DetectAiGenerationOutputSchema>;

export async function detectAiGeneration(input: DetectAiGenerationInput): Promise<DetectAiGenerationOutput> {
    return detectAiGenerationFlow(input);
}

const detectAiGenerationPrompt = ai.definePrompt({
    name: 'detectAiGenerationPrompt',
    input: { schema: DetectAiGenerationInputSchema },
    output: { schema: DetectAiGenerationOutputSchema },
    prompt: `You are an expert in digital forensics and AI generation detection. Analyze the provided content for signs of AI fabrication.

  For Images/Video Frames:
  - Look for visual artifacts: distorted hands/fingers, unnatural text rendering, inconsistent lighting/shadows, overly smooth textures, "plastic" skin, logical inconsistencies in background.
  
  For Text:
  - Look for repetitive patterns, lack of specific details, overly formal or generic "AI-like" tone, hallucinations.

  Provide a probability score (0-100), reasoning, and a list of specific artifacts found.
  
  Content to analyze:
  {{#if text}}
  Text: {{text}}
  {{/if}}
  {{#if dataUri}}
  Image/Frame: [Attached Media]
  {{/if}}
  `,
});

const detectAiGenerationFlow = ai.defineFlow(
    {
        name: 'detectAiGenerationFlow',
        inputSchema: DetectAiGenerationInputSchema,
        outputSchema: DetectAiGenerationOutputSchema,
    },
    async (input) => {
        const { output } = await detectAiGenerationPrompt(input);
        return output!;
    }
);
