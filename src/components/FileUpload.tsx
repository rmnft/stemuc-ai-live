import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileAudio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, File as FileIcon } from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, [disabled]);
  
  const validateFile = (file: File): boolean => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, OGG, FLAC)",
        variant: "destructive"
      });
      return false;
    }
    
    const maxSize = 150 * 1024 * 1024; // Match backend limit (150MB)
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSize / 1024 / 1024}MB`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  const processFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelected(file);
      toast({
        title: "File ready",
        description: `${file.name} selected.`
      });
    } else {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [onFileSelected, toast, disabled]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [onFileSelected, toast, disabled]);
  
  const removeFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleButtonClick = () => {
    if (!disabled) {
        fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn(
      "w-full max-w-2xl mx-auto my-8 p-8 border border-gray-700 rounded-xl text-center transition-all duration-300",
      dragActive ? 'border-red-500 bg-red-500/10 shadow-lg' : 'border-gray-700',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-red-500/70 hover:shadow-md'
    )}
      onClick={disabled ? undefined : handleButtonClick}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <Input
        ref={fileInputRef}
        id="file-upload-input"
        type="file"
        className="hidden"
        accept="audio/mpeg,audio/wav,audio/mp3,audio/ogg,audio/flac"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <Label 
        htmlFor="file-upload-input" 
        className={cn(
            "flex flex-col items-center justify-center",
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        )}
        onClick={(e) => { if (disabled) e.preventDefault(); }}
        >
        {selectedFile ? (
          <div className="flex items-center justify-between w-full bg-gray-900 rounded-lg p-4 cursor-default border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center flex-1 min-w-0">
              <FileIcon className="h-8 w-8 mr-3 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-white">{selectedFile.name}</p>
                <p className="text-sm text-gray-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={removeFile} 
              className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
              disabled={disabled}
            >
              <X size={18} />
            </Button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-12 w-12 mb-4 text-red-500" />
            <span className="text-lg font-medium text-white mb-2">
              Drag & drop your audio file here or click to browse (MP3, WAV, OGG, FLAC)
            </span>
            <span className="text-sm text-gray-400">Maximum file size: 150MB</span>
          </>
        )}
      </Label>
    </div>
  );
};

export default FileUpload;
