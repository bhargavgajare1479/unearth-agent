'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectAiGenerationInputSchema = z.object({
    dataUri: z.string().optional().describe('The image or video frame to analyze.'),
    text: z.string().optional().describe('The text content to analyze.'),
    metadataInfo: z.string().optional().describe('Extracted metadata or EXIF data from the file.'),
});

export type DetectAiGenerationInput = z.infer<typeof DetectAiGenerationInputSchema>;

const DetectAiGenerationOutputSchema = z.object({
    aiProbability: z.number().describe('Probability score from 0 to 100 that the content is AI-generated.'),
    anatomyScore: z.number().optional().describe('0-100 score for anatomical correctness (100 = perfect/real, 0 = obvious AI).'),
    physicsScore: z.number().optional().describe('0-100 score for physics consistency (lighting, shadows, reflections).'),
    textureScore: z.number().optional().describe('0-100 score for texture realism (skin, hair, noise patterns).'),
    reasoning: z.string().describe('Detailed forensic explanation for the score.'),
    artifactsFound: z.array(z.string()).describe('List of specific AI artifacts detected.'),
});

export type DetectAiGenerationOutput = z.infer<typeof DetectAiGenerationOutputSchema>;

export async function detectAiGeneration(input: DetectAiGenerationInput): Promise<DetectAiGenerationOutput> {
    return detectAiGenerationFlow(input);
}

const detectAiGenerationPrompt = ai.definePrompt({
    name: 'detectAiGenerationPrompt',
    input: { schema: DetectAiGenerationInputSchema },
    output: { schema: DetectAiGenerationOutputSchema },
    prompt: `You are a forensic image analyst and AI detection expert. Your job is to determine if content is AI-generated using a strict "Forensic Analysis Protocol".

  Analyze the content in 4 distinct phases. For each phase, assign a "Realism Score" (0-100), where 100 is perfectly natural/real and 0 is obvious AI.

  ### Phase 1: 🧬 Anatomy & Biology (Anatomy Score)
  - **Eyes**: Check for circular pupils, correct corneal reflections (catchlights), and symmetrical tear ducts. AI often fails here.
  - **Hands/Limbs**: Count fingers. Check for merging knuckles or impossible joints.
  - **Teeth**: Look for individual tooth definition vs. a "solid white bar".
  - **Skin/Hair**: Check for pores and individual hair strands. AI skin often looks "waxy" or overly smooth.

  ### Phase 2: 💡 Physics & Environment (Physics Score)
  - **Lighting**: Trace light sources. Do shadows fall in the correct direction?
  - **Reflections**: Do reflections in eyes/mirrors match the environment?
  - **Background**: Look for "MC Escher" architecture (stairs going nowhere, blending walls).

  ### Phase 3: 🔍 Digital Artifacts (Texture Score)
  - **Text**: Look for "gibberish" or alien hieroglyphs in background signs.
  - **Noise**: Real photos have ISO noise. AI images are often noise-free or have "painterly" noise.
  - **Compression**: Look for inconsistent JPEG artifacts.

  ### Phase 4: 💾 Metadata Corroboration
  - **Double Check**: Compare your visual findings with the provided metadata info.
  - **Signatures**: If metadata contains keywords like "Midjourney", "DALL-E", "Stable Diffusion", or "Adobe Firefly", this is a STRONG indicator of AI.
  - **Conflict Resolution**: If visual analysis says "Real" but metadata says "Midjourney", trust the metadata and flag as AI.

  ### Final Verdict
  - Calculate the final **AI Probability** (0-100) based on the lowest realism scores AND the metadata check.
  - If ANY "smoking gun" is found (e.g., 6 fingers, gibberish text, or AI metadata), the AI Probability MUST be > 90%.
  - If the image is just "too perfect" but has no errors, AI Probability should be 40-60%.

  Content to analyze:
  {{#if text}}
  Text: {{text}} (Analyze for repetitive patterns, hallucinations, and lack of specific details)
  {{/if}}
  {{#if metadataInfo}}
  Metadata Info: {{metadataInfo}}
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
