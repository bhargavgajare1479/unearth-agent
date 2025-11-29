'use client';
import { useState } from 'react';
import type { AnalysisResults } from '@/app/actions';
import { AnonymizationPreview } from './anonymization-preview';
import { ContextReport } from './context-report';
import { MetadataReport } from './metadata-report';
import { ScoreDisplay } from './score-display';
import { VerificationReport } from './verification-report';
import { UrlAnalysisReport } from './url-analysis-report';
import { TextAnalysisReport } from './text-analysis-report';
import { ImageAnalysisReport } from './image-analysis-report';

export function AnalysisDashboard({
  results,
  videoUri,
}: {
  results: AnalysisResults;
  videoUri?: string | null;
}) {
  const [language, setLanguage] = useState('English');
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  if (!results) return null;

  const isVideoAnalysis = !!videoUri;
  const isUrlAnalysis = !!results.urlAnalysis;
  const isTextAnalysis = !!results.textAnalysis;
  const isImageAnalysis = !!results.imageAnalysis;

  // Extract the original summary based on type
  const originalSummary =
    results.urlAnalysis?.riskReasoning ||
    results.textAnalysis?.riskReasoning ||
    results.imageAnalysis?.riskReasoning ||
    results.verification?.gdeltResults ||
    "";

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    if (newLang === 'English') {
      setTranslatedSummary(null);
      return;
    }

    setIsTranslating(true);
    try {
      const { translateSummary } = await import('@/app/actions');
      const response = await translateSummary({
        summary: originalSummary,
        targetLanguage: newLang
      });
      setTranslatedSummary(response.translatedSummary);
    } catch (error) {
      console.error("Translation failed", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const displaySummary = translatedSummary || originalSummary;

  return (
    <div className="mt-8 w-full space-y-6">
      <div className="flex justify-end">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="block w-40 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
        >
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Marathi">Marathi</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
        </select>
      </div>

      {isTranslating && <p className="text-sm text-gray-500 animate-pulse">Translating...</p>}

      {/* Pass translated summary to reports if available, otherwise they use their internal props */}
      {/* Note: Ideally we'd pass the translated summary down, but for now we'll just show it in a dedicated box if translated */}

      {translatedSummary && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Translated Summary ({language})</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>{translatedSummary}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isUrlAnalysis && <UrlAnalysisReport urlAnalysis={results.urlAnalysis} />}
      {isTextAnalysis && (
        <TextAnalysisReport
          textAnalysis={results.textAnalysis}
          transcription={results.transcription}
        />
      )}
      {isImageAnalysis && <ImageAnalysisReport imageAnalysis={results.imageAnalysis} />}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ScoreDisplay score={results.misScore?.misinformationImmunityScore} />
        <MetadataReport metadata={results.metadata} integrity={results.integrity} />
        {isVideoAnalysis && <ContextReport context={results.context} />}
      </div>
      <div className="grid gap-6">
        {isVideoAnalysis && <VerificationReport verification={results.verification} />}
        {isVideoAnalysis && videoUri && (
          <AnonymizationPreview
            originalVideo={videoUri}
            anonymizedAudio={results.anonymization?.anonymizedAudioDataUri}
          />
        )}
      </div>
    </div>
  );
}
