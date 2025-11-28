'use server';
/**
 * @fileOverview A flow to analyze text content for misinformation.
 *
 * - analyzeTextContent - A function that handles the text content analysis process.
 * - AnalyzeTextContentInput - The input type for the analyzeTextContent function.
 * - AnalyzeTextContentOutput - The return type for the analyzeTextContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTextContentInputSchema = z.object({
  content: z.string().describe('The text content to analyze.'),
});
export type AnalyzeTextContentInput = z.infer<typeof AnalyzeTextContentInputSchema>;

const AnalyzeTextContentOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the text content.'),
  keyClaims: z.array(z.string()).describe('A list of the key claims made in the text.'),
  contentAnalysis: z
    .string()
    .describe("An assessment of the text's style, tone, and potential biases."),
  misinformationRisk: z
    .enum(['Low', 'Medium', 'High'])
    .describe('The assessed risk of the content being misinformation.'),
  riskReasoning: z.string().describe('The reasoning behind the misinformation risk assessment.'),
});
export type AnalyzeTextContentOutput = z.infer<typeof AnalyzeTextContentOutputSchema>;

export async function analyzeTextContent(input: AnalyzeTextContentInput): Promise<AnalyzeTextContentOutput> {
  return analyzeTextContentFlow(input);
}

const analyzeTextContentPrompt = ai.definePrompt({
  name: 'analyzeTextContentPrompt',
  input: {schema: AnalyzeTextContentInputSchema},
  output: {schema: AnalyzeTextContentOutputSchema},
  prompt: `You are a fact-checking expert. Analyze the provided text content.

  1.  **Summarize the Content:** Briefly summarize the main points of the text.
  2.  **Extract Key Claims:** Identify and list the main factual claims made.
  3.  **Assess Content Style:** Evaluate the style and tone of the text. Look for sensationalism, loaded language, emotional appeals, or other persuasive techniques.
  4.  **Assess Misinformation Risk:** Based on the content, assess the risk of it being misinformation (Low, Medium, or High).
  5.  **Provide Reasoning:** Explain your reasoning for the risk assessment. Note any lack of evidence, logical fallacies, or contradictions with established facts.

  Return your analysis in the specified JSON format.
  
  Content to analyze:
  ---
  {{{content}}}
  ---`,
});

const analyzeTextContentFlow = ai.defineFlow(
  {
    name: 'analyzeTextContentFlow',
    inputSchema: AnalyzeTextContentInputSchema,
    outputSchema: AnalyzeTextContentOutputSchema,
  },
  async input => {
    const {output} = await analyzeTextContentPrompt(input);
    return output!;
  }
);
