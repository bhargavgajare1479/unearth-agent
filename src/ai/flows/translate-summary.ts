'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateSummaryInputSchema = z.object({
    summary: z.string().describe('The analysis summary to translate.'),
    targetLanguage: z.string().describe('The target language (e.g., Hindi, Marathi, Spanish).'),
});

export type TranslateSummaryInput = z.infer<typeof TranslateSummaryInputSchema>;

const TranslateSummaryOutputSchema = z.object({
    translatedSummary: z.string().describe('The translated summary.'),
});

export type TranslateSummaryOutput = z.infer<typeof TranslateSummaryOutputSchema>;

export async function translateSummary(input: TranslateSummaryInput): Promise<TranslateSummaryOutput> {
    return translateSummaryFlow(input);
}

const translateSummaryPrompt = ai.definePrompt({
    name: 'translateSummaryPrompt',
    input: { schema: TranslateSummaryInputSchema },
    output: { schema: TranslateSummaryOutputSchema },
    prompt: `You are a professional translator. Translate the following analysis summary into {{targetLanguage}}.
  
  Ensure the tone remains objective and professional. Keep the meaning accurate.

  Summary:
  {{summary}}
  `,
});

const translateSummaryFlow = ai.defineFlow(
    {
        name: 'translateSummaryFlow',
        inputSchema: TranslateSummaryInputSchema,
        outputSchema: TranslateSummaryOutputSchema,
    },
    async (input) => {
        const { output } = await translateSummaryPrompt(input);
        return output!;
    }
);
