'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX } from "lucide-react";

interface AnonymizationPreviewProps {
    originalVideo: string;
    anonymizedAudio?: string;
}

export function AnonymizationPreview({ originalVideo, anonymizedAudio }: AnonymizationPreviewProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md">
                   <UserX className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline">Voice Anonymization</CardTitle>
                    <CardDescription>The original video with its audio replaced by a synthetic, anonymized voice.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-2 text-center">Original Video</h3>
                    <video key={originalVideo} controls src={originalVideo} className="w-full rounded-md border aspect-video bg-muted" />
                </div>
                <div>
                    <h3 className="font-semibold mb-2 text-center">Anonymized Playback</h3>
                    <div className="w-full rounded-md border aspect-video bg-muted flex flex-col">
                        <video key={originalVideo + '-anon'} muted src={originalVideo} className="w-full h-full object-cover" autoPlay loop playsInline />
                         {anonymizedAudio && (
                            <div className="p-2 border-t bg-background/50">
                                <audio key={anonymizedAudio} controls src={anonymizedAudio} className="w-full" />
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
