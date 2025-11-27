'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type DetectRecycledFootageOutput } from "@/ai/flows/detect-recycled-footage";
import { Globe, Tags, Hash } from "lucide-react";

interface VerificationReportProps {
    verification?: DetectRecycledFootageOutput;
}

export function VerificationReport({ verification }: VerificationReportProps) {
    if (!verification) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Cross-Verification Report</CardTitle>
                    <CardDescription>Analysis unavailable.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Could not generate cross-verification report.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
             <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md">
                   <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline">"Voice of the Internet" Cross-Verification</CardTitle>
                    <CardDescription>Detects recycled footage and corroborates events with global news data.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Hash className="w-4 h-4 text-accent"/>Perceptual Hash (pHash)</h4>
                    <p className="font-code text-sm p-2 bg-muted rounded-md truncate">{verification.perceptualHash}</p>
                 </div>
                 <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Tags className="w-4 h-4 text-accent"/>Extracted Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                        {verification.extractedKeywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary">{keyword}</Badge>
                        ))}
                    </div>
                 </div>
                 <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Globe className="w-4 h-4 text-accent"/>GDELT News Database Summary</h4>
                    <p className="text-sm p-3 bg-muted/50 rounded-md text-foreground/80">{verification.gdeltResults}</p>
                 </div>
            </CardContent>
        </Card>
    );
}
