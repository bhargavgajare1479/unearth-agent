
'use client';
import { useState } from 'react';
import { AnalysisDashboard } from '@/components/analysis/analysis-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Film, FileCheck2, AlertCircle, Link, Type, Image as ImageIcon, Mic } from 'lucide-react';
import type { AnalysisResults } from '@/app/actions';
import { analyzeInput } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from './file-uploader';

type InputType = 'video' | 'audio' | 'image' | 'text' | 'url';

export function Dashboard() {
  const [inputType, setInputType] = useState<InputType>('video');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const { toast } = useToast();

  const handleFileChange = (file: File | null) => {
    if (file) {
      const fileType = file.type.split('/')[0];
      if (['video', 'audio', 'image'].includes(fileType)) {
        setFile(file);
        setResults(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid video, audio, or image file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAnalyze = async () => {
    let analysisPromise;
    setIsLoading(true);
    setResults(null);
    
    switch (inputType) {
      case 'video':
      case 'audio':
      case 'image':
        if (!file) {
          toast({ title: "No file selected", description: "Please upload a file to analyze.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        analysisPromise = new Promise((resolve, reject) => {
            reader.onload = async (event) => {
                const dataUri = event.target?.result as string;
                if (dataUri) {
                    try {
                        const analysisResults = await analyzeInput({ type: inputType, dataUri });
                        resolve(analysisResults);
                    } catch (error) {
                        reject(error);
                    }
                }
            };
            reader.onerror = (error) => reject(error);
        });
        break;
      case 'text':
        if (!textContent) {
          toast({ title: "No text provided", description: "Please enter text to analyze.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        analysisPromise = analyzeInput({ type: 'text', content: textContent });
        break;
      case 'url':
        if (!urlContent) {
            toast({ title: "No URL provided", description: "Please enter a URL to analyze.", variant: "destructive" });
            setIsLoading(false);
            return;
        }
        analysisPromise = analyzeInput({ type: 'url', content: urlContent });
        break;
      default:
        setIsLoading(false);
        return;
    }

    try {
        const analysisResults = await analysisPromise as AnalysisResults;
        setResults(analysisResults);
    } catch (error) {
        console.error(error);
        toast({
            title: "Analysis Failed",
            description: "An error occurred during the analysis. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setTextContent('');
    setUrlContent('');
    setResults(null);
    setIsLoading(false);
  }

  const isAnalysisButtonDisabled = isLoading || (inputType === 'text' && !textContent) || (inputType === 'url' && !urlContent) || (['video', 'audio', 'image'].includes(inputType) && !file);
  
  const renderInputArea = () => {
    switch(inputType) {
        case 'url':
            return (
              <div className="flex flex-col gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={urlContent}
                  onChange={(e) => setUrlContent(e.target.value)}
                  disabled={isLoading}
                  className="p-4"
                />
                <p className="text-sm text-muted-foreground">Enter a URL to a news article, social media post, or website.</p>
              </div>
            );
        case 'text':
            return (
              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="Paste text here for analysis..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  disabled={isLoading}
                  rows={6}
                  className="p-4"
                />
                <p className="text-sm text-muted-foreground">Analyze a block of text for potential misinformation.</p>
              </div>
            );
        default: // 'video', 'audio', 'image'
            return (
                <div>
                  {!file && <FileUploader onFileChange={handleFileChange} accept={{ [`${inputType}/*`]: [] }} />}
                  {file && (
                    <Card className="w-full shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row items-center gap-6">
                          <div className="w-full lg:w-1/2 xl:w-2/3 rounded-lg overflow-hidden border">
                              {inputType === 'video' && previewUrl && <video src={previewUrl} controls className="w-full aspect-video" />}
                              {inputType === 'image' && previewUrl && <img src={previewUrl} alt="Preview" className="w-full aspect-video object-cover" />}
                              {inputType === 'audio' && previewUrl && 
                                <div className="w-full aspect-video flex items-center justify-center bg-muted">
                                  <audio src={previewUrl} controls />
                                </div>
                              }
                          </div>
                          <div className="w-full lg:w-1/2 xl:w-1/3 flex flex-col gap-4">
                            <div className='flex items-start gap-4'>
                                {inputType === 'video' && <Film className='w-8 h-8 text-primary mt-1'/>}
                                {inputType === 'image' && <ImageIcon className='w-8 h-8 text-primary mt-1'/>}
                                {inputType === 'audio' && <Mic className='w-8 h-8 text-primary mt-1'/>}
                                <div>
                                    <h2 className="text-xl font-headline font-semibold">{file.name}</h2>
                                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <Button size="lg" variant="outline" className="w-full" onClick={resetState} disabled={isLoading}>
                                Upload New File
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
            )
    }
  }


  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <Card>
        <CardContent className="p-6">
            <Tabs value={inputType} onValueChange={(value) => { resetState(); setInputType(value as InputType);}} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                    <TabsTrigger value="video"><Film className="mr-2" />Video</TabsTrigger>
                    <TabsTrigger value="image"><ImageIcon className="mr-2" />Image</TabsTrigger>
                    <TabsTrigger value="audio"><Mic className="mr-2" />Audio</TabsTrigger>
                    <TabsTrigger value="url"><Link className="mr-2" />URL</TabsTrigger>
                    <TabsTrigger value="text"><Type className="mr-2" />Text</TabsTrigger>
                </TabsList>
                <TabsContent value="video">{renderInputArea()}</TabsContent>
                <TabsContent value="image">{renderInputArea()}</TabsContent>
                <TabsContent value="audio">{renderInputArea()}</TabsContent>
                <TabsContent value="url">{renderInputArea()}</TabsContent>
                <TabsContent value="text">{renderInputArea()}</TabsContent>
            </Tabs>
             <div className="mt-6 flex justify-end">
                <Button size="lg" className="w-full sm:w-auto" onClick={handleAnalyze} disabled={isAnalysisButtonDisabled}>
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                    </>
                ) : 'Run Forensic Analysis'}
                </Button>
            </div>
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="mt-8 flex flex-col items-center justify-center text-center gap-4 p-8 rounded-lg bg-card border">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className='text-xl font-headline font-medium'>Running Forensic Analysis</h3>
            <p className="max-w-md text-muted-foreground">Unearth Agent is processing the input. This may take a moment depending on the content and complexity of the analysis.</p>
        </div>
      )}

      {results && <AnalysisDashboard results={results} videoUri={inputType === 'video' ? previewUrl : undefined} />}
    </div>
  );
}
