'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type VerifyCrisisFootageContextOutput } from "@/ai/flows/verify-crisis-footage-context";
import { SunMoon, CheckCircle2, XCircle, Thermometer, Cloudy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContextReportProps {
    context?: VerifyCrisisFootageContextOutput;
}

export function ContextReport({ context }: ContextReportProps) {
    if (!context) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Context Report</CardTitle>
                    <CardDescription>Analysis unavailable.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Could not generate context report.</p>
                </CardContent>
            </Card>
        );
    }
    
    const weatherMatch = context.weatherMatch;

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md">
                   <SunMoon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline">Crisis-Context Mismatch Engine</CardTitle>
                    <CardDescription>Verifies if physical reality matches metadata claims.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                        <Thermometer className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Solar Altitude</span>
                    </div>
                    <span className="font-mono font-semibold text-primary">{context.solarAltitude.toFixed(2)}°</span>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                        <SunMoon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Solar Azimuth</span>
                    </div>
                    <span className="font-mono font-semibold text-primary">{context.solarAzimuth.toFixed(2)}°</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                        <Cloudy className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Weather Match</span>
                    </div>
                     <Badge variant={weatherMatch ? "default" : "destructive"} className={`text-white ${weatherMatch ? 'bg-green-600' : 'bg-red-600'}`}>
                        {weatherMatch ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                        {weatherMatch ? "Verified" : "Mismatch"}
                    </Badge>
                </div>
                {!weatherMatch && context.mismatchReason && (
                    <div className="p-3 border-l-4 border-destructive bg-destructive/10 rounded-r-lg">
                        <p className="text-sm text-destructive-foreground font-semibold">Reason:</p>
                        <p className="text-sm text-destructive-foreground/80">{context.mismatchReason}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
