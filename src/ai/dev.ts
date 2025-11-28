import { config } from 'dotenv';
config();

import '@/ai/flows/assess-misinformation-trust-score.ts';
import '@/ai/flows/anonymize-whistleblower-identity.ts';
import '@/ai/flows/detect-recycled-footage.ts';
import '@/ai/flows/verify-crisis-footage-context.ts';
import '@/ai/flows/analyze-url-content.ts';
