'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {type AnalyzeImageContentOutput} from '@/ai/flows/analyze-image-content';
import {Badge} from '@/components/ui/badge';
import {FileText, Image, Search, ShieldAlert} from 'lucide-react';

interface ImageAnalysisReportProps {
  imageAnalysis?: AnalyzeImageContentOutput;
}

export function ImageAnalysisReport({imageAnalysis}: ImageAnalysisReportProps) {
  if (!imageAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Image Analysis Report</CardTitle>
          <CardDescription>Analysis unavailable.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Could not generate image analysis report.</p>
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
          <Image className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle className="font-headline">Image Content Analysis</CardTitle>
          <CardDescription>
            Forensic analysis of the provided image for manipulation and misinformation risk.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Image Description
          </h4>
          <p className="text-sm p-3 bg-muted/50 rounded-md text-foreground/80">
            {imageAnalysis.description}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent" />
            Misinformation Risk
          </h4>
          <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
            <Badge className={`text-white ${riskColorMap[imageAnalysis.misinformationRisk]}`}>
              {imageAnalysis.misinformationRisk}
            </Badge>
            <p className="text-sm text-foreground/80">{imageAnalysis.riskReasoning}</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Manipulation Assessment
          </h4>
          <p className="text-sm p-3 bg-muted/50 rounded-md text-foreground/80">
            {imageAnalysis.manipulationAssessment}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-accent" />
            Reverse Image Search Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {imageAnalysis.reverseImageSearchKeywords.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
