'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileCode, Fingerprint, Film, Music } from "lucide-react";

interface MetadataReportProps {
    metadata?: { flags: string[] };
    integrity?: { videoStreamHash: string; audioStreamHash: string; };
}

export function MetadataReport({ metadata, integrity }: MetadataReportProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                 <div className="p-2 bg-primary/10 rounded-md">
                   <FileCode className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline">Digital Fingerprint</CardTitle>
                    <CardDescription>Metadata analysis and file integrity verification.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-accent"/>Digital Birth Certificate Flags</h4>
                    {metadata && metadata.flags.length > 0 ? (
                        <ul className="space-y-2 text-sm text-foreground/80">
                            {metadata.flags.map((flag, index) => (
                                <li key={index} className="pl-4 border-l-2 border-accent/50">{flag}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No suspicious metadata flags found.</p>
                    )}
                </div>
                 <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Fingerprint className="w-4 h-4 text-accent"/>Stream-Level Hashes (MD5)</h4>
                     <div className="space-y-2 font-code text-sm">
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                           <Film className="w-4 h-4 text-muted-foreground" />
                           <span className="truncate">{integrity?.videoStreamHash || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                           <Music className="w-4 h-4 text-muted-foreground" />
                           <span className="truncate">{integrity?.audioStreamHash || 'N/A'}</span>
                        </div>
                     </div>
                </div>
            </CardContent>
        </Card>
    );
}
