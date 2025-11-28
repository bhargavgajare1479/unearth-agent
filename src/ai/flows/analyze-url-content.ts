'use server';
/**
 * @fileOverview A flow to analyze the content of a URL for misinformation.
 *
 * - analyzeUrlContent - A function that handles the URL content analysis process.
 * - AnalyzeUrlContentInput - The input type for the analyzeUrlContent function.
 * - AnalyzeUrlContentOutput - The return type for the analyzeUrlContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUrlContentInputSchema = z.object({
  url: z.string().url().describe('The URL of the content to analyze.'),
});
export type AnalyzeUrlContentInput = z.infer<typeof AnalyzeUrlContentInputSchema>;

const AnalyzeUrlContentOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the content found at the URL.'),
  keyClaims: z.array(z.string()).describe('A list of the key claims made in the content.'),
  sourceReputation: z.string().describe('An assessment of the source\'s reputation and potential biases.'),
  misinformationRisk: z.enum(['Low', 'Medium', 'High']).describe('The assessed risk of the content being misinformation.'),
  riskReasoning: z.string().describe('The reasoning behind the misinformation risk assessment.'),
});
export type AnalyzeUrlContentOutput = z.infer<typeof AnalyzeUrlContentOutputSchema>;

export async function analyzeUrlContent(input: AnalyzeUrlContentInput): Promise<AnalyzeUrlContentOutput> {
  return analyzeUrlContentFlow(input);
}

const analyzeUrlContentPrompt = ai.definePrompt({
  name: 'analyzeUrlContentPrompt',
  input: {schema: AnalyzeUrlContentInputSchema},
  output: {schema: AnalyzeUrlContentOutputSchema},
  prompt: `You are a fact-checking expert. Analyze the content at the provided URL: {{{url}}}.

  1.  **Summarize the Content:** Briefly summarize the main points of the article or content.
  2.  **Extract Key Claims:** Identify and list the main factual claims made.
  3.  **Assess Source Reputation:** Evaluate the reputation of the source (e.g., news outlet, blog). Consider factors like journalistic standards, known biases, and publication history.
  4.  **Assess Misinformation Risk:** Based on the content and source, assess the risk of it being misinformation (Low, Medium, or High).
  5.  **Provide Reasoning:** Explain your reasoning for the risk assessment. Look for sensationalism, loaded language, lack of evidence, or contradictions with established facts.

  Return your analysis in the specified JSON format.`,
});

const analyzeUrlContentFlow = ai.defineFlow(
  {
    name: 'analyzeUrlContentFlow',
    inputSchema: AnalyzeUrlContentInputSchema,
    outputSchema: AnalyzeUrlContentOutputSchema,
  },
  async input => {
    // In a real-world scenario, you might want to fetch the URL content here
    // and pass it to the prompt if the model has no internet access.
    // However, Gemini has internet access, so we can pass the URL directly.
    const {output} = await analyzeUrlContentPrompt(input);
    return output!;
  }
);
