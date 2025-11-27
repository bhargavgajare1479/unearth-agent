
'use client';

import { UploadCloud } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from './ui/card';

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
  accept: Accept;
}

export function FileUploader({ onFileChange, accept }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragging(false);
    if (acceptedFiles.length > 0) {
      onFileChange(acceptedFiles[0]);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    multiple: false,
    accept: accept,
  });

  const getUploadMessage = () => {
      const acceptedTypes = Object.keys(accept).join(', ').replace('/*', '');
      return `Upload a ${acceptedTypes} for Analysis`;
  }

  return (
    <Card className={`transition-all duration-300 ${isDragging ? 'border-primary shadow-2xl scale-105' : 'shadow-lg'}`}>
        <CardContent className="p-6">
            <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors duration-300">
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                <UploadCloud className={`w-16 h-16 transition-colors duration-300 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <h2 className="text-2xl font-headline font-bold tracking-tight">{getUploadMessage()}</h2>
                <p className="text-muted-foreground">Drag & drop a file here, or click to select a file</p>
                <Button type="button" onClick={open} className="mt-4" size="lg">
                    Browse Files
                </Button>
                </div>
            </div>
        </CardContent>
    </Card>

  );
}
