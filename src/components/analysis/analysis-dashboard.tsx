
'use client';
import type { AnalysisResults } from '@/app/actions';
import { AnonymizationPreview } from './anonymization-preview';
import { ContextReport } from './context-report';
import { MetadataReport } from './metadata-report';
import { ScoreDisplay } from './score-display';
import { VerificationReport } from './verification-report';
import { UrlAnalysisReport } from './url-analysis-report';

export function AnalysisDashboard({ results, videoUri }: { results: AnalysisResults, videoUri?: string | null }) {
  if (!results) return null;

  const isVideoAnalysis = !!videoUri;
  const isUrlAnalysis = !!results.urlAnalysis;

  return (
    <div className="mt-8 w-full space-y-6">
      {isUrlAnalysis && <UrlAnalysisReport urlAnalysis={results.urlAnalysis} />}
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
            anonymizedVideo={results.anonymization?.anonymizedVideoDataUri} 
          />
        )}
      </div>
    </div>
  );
}
