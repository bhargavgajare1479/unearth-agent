'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX } from "lucide-react";

interface AnonymizationPreviewProps {
    originalVideo: string;
    anonymizedVideo?: string;
}

export function AnonymizationPreview({ originalVideo, anonymizedVideo }: AnonymizationPreviewProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md">
                   <UserX className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline">User Anonymization Preview</CardTitle>
                    <CardDescription>Preview of the whistleblower identity masking process.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-2 text-center">Original Video</h3>
                    <video key={originalVideo} controls src={originalVideo} className="w-full rounded-md border aspect-video bg-muted" />
                </div>
                <div>
                    <h3 className="font-semibold mb-2 text-center">Anonymized Preview</h3>
                    <video key={anonymizedVideo} controls src={anonymizedVideo || originalVideo} className="w-full rounded-md border aspect-video bg-muted" />
                </div>
            </CardContent>
        </Card>
    );
}
