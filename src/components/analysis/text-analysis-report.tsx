'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {type AnalyzeTextContentOutput} from '@/ai/flows/analyze-text-content';
import {Badge} from '@/components/ui/badge';
import {FileText, ShieldAlert, Type} from 'lucide-react';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '../ui/accordion';

interface TextAnalysisReportProps {
  textAnalysis?: AnalyzeTextContentOutput;
  transcription?: string;
}

export function TextAnalysisReport({textAnalysis, transcription}: TextAnalysisReportProps) {
  if (!textAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Text Analysis Report</CardTitle>
          <CardDescription>Analysis unavailable.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Could not generate text analysis report.</p>
        </CardContent>
      </Card>
    );
  }

  const riskColorMap = {
    Low: 'bg-green-600',
    Medium: 'bg-yellow-500',
    High: 'bg-red-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-md">
          <Type className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle className="font-headline">Text Content Analysis</CardTitle>
          <CardDescription>
            Fact-checking and risk assessment for the provided text or audio transcription.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {transcription && (
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>View Audio Transcription</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm p-3 bg-muted/50 rounded-md text-foreground/80 whitespace-pre-wrap">
                  {transcription}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Content Summary
          </h4>
          <p className="text-sm p-3 bg-muted/50 rounded-md text-foreground/80">
            {textAnalysis.summary}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent" />
            Misinformation Risk
          </h4>
          <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
            <Badge className={`text-white ${riskColorMap[textAnalysis.misinformationRisk]}`}>
              {textAnalysis.misinformationRisk}
            </Badge>
            <p className="text-sm text-foreground/80">{textAnalysis.riskReasoning}</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Content Style Analysis
          </h4>
          <p className="text-sm p-3 bg-muted/50 rounded-md text-foreground/80">
            {textAnalysis.contentAnalysis}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Key Claims
          </h4>
          <ul className="space-y-2 text-sm text-foreground/80">
            {textAnalysis.keyClaims.map((claim, index) => (
              <li key={index} className="pl-4 border-l-2 border-accent/50">
                {claim}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
