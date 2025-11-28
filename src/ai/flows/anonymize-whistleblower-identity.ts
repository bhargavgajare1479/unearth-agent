'use server';
/**
 * @fileOverview A flow to anonymize a whistleblower's identity in a video by replacing their voice.
 *
 * - anonymizeWhistleblowerIdentity - A function that handles the anonymization process.
 * - AnonymizeWhistleblowerIdentityInput - The input type for the anonymizeWhistleblowerIdentity function.
 * - AnonymizeWhistleblowerIdentityOutput - The return type for the anonymizeWhistleblowerIdentity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

const AnonymizeWhistleblowerIdentityInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a whistleblower, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnonymizeWhistleblowerIdentityInput = z.infer<
  typeof AnonymizeWhistleblowerIdentityInputSchema
>;

const AnonymizeWhistleblowerIdentityOutputSchema = z.object({
  anonymizedAudioDataUri: z
    .string()
    .describe(
      "The anonymized audio track, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:audio/wav;base64,<encoded_data>'."
    ),
});
export type AnonymizeWhistleblowerIdentityOutput = z.infer<
  typeof AnonymizeWhistleblowerIdentityOutputSchema
>;

export async function anonymizeWhistleblowerIdentity(
  input: AnonymizeWhistleblowerIdentityInput
): Promise<AnonymizeWhistleblowerIdentityOutput> {
  return anonymizeWhistleblowerIdentityFlow(input);
}

// Helper function to convert PCM audio data to WAV format.
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const anonymizeWhistleblowerIdentityFlow = ai.defineFlow(
  {
    name: 'anonymizeWhistleblowerIdentityFlow',
    inputSchema: AnonymizeWhistleblowerIdentityInputSchema,
    outputSchema: AnonymizeWhistleblowerIdentityOutputSchema,
  },
  async input => {
    // 1. Transcribe the audio from the video file.
    const {text: transcription} = await ai.generate({
      prompt: [
        {text: 'Transcribe the audio from this video. Respond only with the transcribed text.'},
        {media: {url: input.videoDataUri}},
      ],
      model: 'googleai/gemini-2.5-flash',
    });

    if (!transcription) {
      throw new Error('Could not transcribe audio from video.');
    }

    // 2. Generate new audio from the transcription using a TTS model.
    const {media: ttsMedia} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Use a prebuilt voice for anonymization.
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: transcription,
    });

    if (!ttsMedia?.url) {
      throw new Error('Failed to generate anonymized audio.');
    }

    // 3. The TTS model returns raw PCM audio. Convert it to WAV format.
    const pcmAudioBuffer = Buffer.from(
      ttsMedia.url.substring(ttsMedia.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(pcmAudioBuffer);

    return {
      anonymizedAudioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
