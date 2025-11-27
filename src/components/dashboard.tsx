'use client';
import { useState } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { AnalysisDashboard } from '@/components/analysis/analysis-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Film, FileCheck2, AlertCircle } from 'lucide-react';
import type { AnalysisResults } from '@/app/actions';
import { analyzeVideo } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export function Dashboard() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const { toast } = useToast();

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setResults(null);
        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl);
        }
        const url = URL.createObjectURL(file);
        setVideoPreviewUrl(url);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a video file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;

    setIsLoading(true);
    setResults(null);

    const reader = new FileReader();
    reader.readAsDataURL(videoFile);
    reader.onload = async (event) => {
      const videoDataUri = event.target?.result as string;
      if (videoDataUri) {
        try {
          const analysisResults = await analyzeVideo(videoDataUri);
          setResults(analysisResults);
        } catch (error) {
          console.error(error);
          toast({
            title: "Analysis Failed",
            description: "An error occurred during video analysis. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({
            title: "File Read Error",
            description: "Could not read the selected video file.",
            variant: "destructive",
        });
        setIsLoading(false);
    };
  };

  const resetState = () => {
    setVideoFile(null);
    if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
    setResults(null);
    setIsLoading(false);
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {!videoFile && <FileUploader onFileChange={handleFileChange} />}
      
      {videoFile && (
        <Card className="w-full shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="w-full lg:w-1/2 xl:w-2/3 rounded-lg overflow-hidden border">
                {videoPreviewUrl && <video src={videoPreviewUrl} controls className="w-full aspect-video" />}
              </div>
              <div className="w-full lg:w-1/2 xl:w-1/3 flex flex-col gap-4">
                <div className='flex items-start gap-4'>
                    <Film className='w-8 h-8 text-primary mt-1'/>
                    <div>
                        <h2 className="text-xl font-headline font-semibold">{videoFile.name}</h2>
                        <p className="text-sm text-muted-foreground">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Button size="lg" className="w-full" onClick={handleAnalyze} disabled={isLoading}>
                    {isLoading ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                        </>
                    ) : 'Run Forensic Analysis'}
                    </Button>
                    <Button size="lg" variant="outline" className="w-full" onClick={resetState} disabled={isLoading}>
                        Upload New Video
                    </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="mt-8 flex flex-col items-center justify-center text-center gap-4 p-8 rounded-lg bg-card border">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className='text-xl font-headline font-medium'>Running Forensic Analysis</h3>
            <p className="max-w-md text-muted-foreground">Unearth Agent is processing the video. This may take a moment depending on the video size and complexity of the analysis.</p>
        </div>
      )}

      {results && videoPreviewUrl && <AnalysisDashboard results={results} videoUri={videoPreviewUrl} />}
    </div>
  );
}
