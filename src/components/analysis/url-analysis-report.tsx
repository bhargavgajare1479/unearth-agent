'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type AnalyzeUrlContentOutput } from "@/ai/flows/analyze-url-content";
import { Badge } from "@/components/ui/badge";
import { FileText, Link, ShieldAlert } from "lucide-react";

interface UrlAnalysisReportProps {
    urlAnalysis?: AnalyzeUrlContentOutput;
}

export function UrlAnalysisReport({ urlAnalysis }: UrlAnalysisReportProps) {
    if (!urlAnalysis) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>URL Analysis Report</CardTitle>
                    <CardDescription>Analysis unavailable.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Could not generate URL analysis report.</p>
                </CardContent>
            </Card>
        );
    }

    const riskColorMap = {
        'Low': 'bg-green-600',
        'Medium': 'bg-yellow-500',
        'High': 'bg-red-600'
    };
    
    return (
        <Card>
             <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md">
                   <Link className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline">URL Content Analysis</CardTitle>
                    <CardDescription>Fact-checking and source reputation assessment for the provided link.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-accent"/>Content Summary</h4>
                    <p className="text-sm p-3 bg-muted/50 rounded-md text-foreground/80">{urlAnalysis.summary}</p>
                 </div>
                 <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-accent"/>Misinformation Risk</h4>
                    <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                        <Badge className={`text-white ${riskColorMap[urlAnalysis.misinformationRisk]}`}>{urlAnalysis.misinformationRisk}</Badge>
                        <p className="text-sm text-foreground/80">{urlAnalysis.riskReasoning}</p>
                    </div>
                 </div>
                 <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-accent"/>Source Reputation</h4>
                    <p className="text-sm p-3 bg-muted/50 rounded-md text-foreground/80">{urlAnalysis.sourceReputation}</p>
                 </div>
                 <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-accent"/>Key Claims</h4>
                    <ul className="space-y-2 text-sm text-foreground/80">
                        {urlAnalysis.keyClaims.map((claim, index) => (
                            <li key={index} className="pl-4 border-l-2 border-accent/50">{claim}</li>
                        ))}
                    </ul>
                 </div>
            </CardContent>
        </Card>
    );
}
