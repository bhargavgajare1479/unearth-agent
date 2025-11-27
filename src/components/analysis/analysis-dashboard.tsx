'use client';
import type { AnalysisResults } from '@/app/actions';
import { AnonymizationPreview } from './anonymization-preview';
import { ContextReport } from './context-report';
import { MetadataReport } from './metadata-report';
import { ScoreDisplay } from './score-display';
import { VerificationReport } from './verification-report';

export function AnalysisDashboard({ results, videoUri }: { results: AnalysisResults, videoUri: string }) {
  if (!results) return null;

  return (
    <div className="mt-8 w-full space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ScoreDisplay score={results.misScore?.misinformationImmunityScore} />
        <MetadataReport metadata={results.metadata} integrity={results.integrity} />
        <ContextReport context={results.context} />
      </div>
      <div className="grid gap-6">
        <VerificationReport verification={results.verification} />
        <AnonymizationPreview 
          originalVideo={videoUri} 
          anonymizedVideo={results.anonymization?.anonymizedVideoDataUri} 
        />
      </div>
    </div>
  );
}
