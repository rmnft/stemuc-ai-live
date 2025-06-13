import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Particles from '@/components/Particles';
import FileUpload from '@/components/FileUpload';
import ModelSelection, { ModelSelectionValue, SeparationMode } from '@/components/ModelSelection';
import ProcessingScreen from '@/components/ProcessingScreen';
import ResultsView from '@/components/ResultsView';
import { ArrowUp, Settings, ArrowDown } from 'lucide-react';

import { getApiUrl, config } from '@/config/environment';

const Index: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [separationConfig, setSeparationConfig] = useState<ModelSelectionValue>({ 
    mode: "4-stem",
    selectedCustomStems: [],
    enableDiarization: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [processedStems, setProcessedStems] = useState<string[] | null>(null);
  const [diarizationResult, setDiarizationResult] = useState<any>(null);
  const [originalAudioPath, setOriginalAudioPath] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setProcessedStems(null);
    setDiarizationResult(null);
    setOriginalAudioPath(null);
    setApiError(null);
  };
  
  const handleSeparationConfigChange = (config: ModelSelectionValue) => {
    setSeparationConfig(config);
    setProcessedStems(null);
    setDiarizationResult(null);
    setOriginalAudioPath(null);
    setApiError(null);
  };
  
  const handleStartProcessing = async () => {
    if (!selectedFile) {
      toast({ title: "Error", description: "Please select an audio file first.", variant: "destructive" });
      return;
    }
    if (separationConfig.mode === "custom" && (!separationConfig.selectedCustomStems || separationConfig.selectedCustomStems.length === 0)) {
      toast({ title: "Error", description: "Please select at least one instrument for custom separation.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setIsApiLoading(true);
    setApiError(null);
    setProcessedStems(null);
    setOriginalAudioPath(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('mode', separationConfig.mode);
    formData.append('enable_diarization', separationConfig.enableDiarization ? 'true' : 'false');

    if (separationConfig.mode === "custom" && separationConfig.selectedCustomStems) {
      separationConfig.selectedCustomStems.forEach(stem => {
        formData.append('selectedStems', stem);
      });
    }

    try {
      console.log(`Sending ${selectedFile.name} for mode: ${separationConfig.mode}, custom stems: ${separationConfig.selectedCustomStems?.join(', ')}, diarization: ${separationConfig.enableDiarization}`);
      const response = await fetch(getApiUrl('/separate'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = `HTTP error ${response.status}`; 
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorDetail);
      }

      const result = await response.json();
      console.log('Separation successful:', result);
      setProcessedStems(result.stems || []);
      setOriginalAudioPath(result.original_audio_path || null);
      setDiarizationResult(result.diarization || null);
      setApiError(null);

    } catch (err: any) {
      console.error('Separation failed:', err);
      const errorMsg = err.message || 'An unknown error occurred during separation.';
      setApiError(errorMsg);
      toast({ title: "Separation Failed", description: errorMsg, variant: "destructive" });
      setProcessedStems(null);
      setOriginalAudioPath(null);
      setIsProcessing(false);
    } finally {
      setIsApiLoading(false);
    }
  };
  
  const handleProcessingComplete = () => {
    setIsProcessing(false);
    if (!apiError && (processedStems || originalAudioPath)) {
       toast({ title: "Success!", description: "Audio processed successfully." });
    }
  };
  
  const handleReset = () => {
    setSelectedFile(null);
    setSeparationConfig({ mode: "4-stem", selectedCustomStems: [], enableDiarization: false });
    setProcessedStems(null);
    setOriginalAudioPath(null);
    setApiError(null);
    setIsProcessing(false);
    setIsApiLoading(false);
  };
  
  const showResults = (processedStems !== null || originalAudioPath !== null) && !isApiLoading;
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-6 py-12">
        {/* Homepage Content */}
        {!selectedFile && !showResults && (
          <div className="max-w-6xl mx-auto">
            {/* Main Title Section */}
            <div className="text-center mb-16">
              <h1 className="text-6xl font-bold mb-4">
                <span className="text-red-500">Stemuc Audio Forge</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Separate your audio into individual stems using advanced AI technology
              </p>
            </div>

            {/* Explanation Section */}
            <div className="text-center mb-16">
              <div className="w-24 h-px bg-gray-700 mx-auto mb-8"></div>
              <p className="text-lg text-gray-200 max-w-4xl mx-auto leading-relaxed">
                Stemuc Audio Forge is a powerful tool that separates audio tracks into individual stems using advanced AI technology.
              </p>
              <div className="w-24 h-px bg-gray-700 mx-auto mt-8"></div>
            </div>

            {/* How it Works Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-white text-center mb-12">How it works</h2>
              
              <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
                {/* Step 1 - Upload */}
                <div className="group text-center">
                  <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 group-hover:border-gray-700 transition-all duration-300">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-500 transition-colors duration-300">
                      <ArrowUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Upload your audio file</h3>
                    <p className="text-gray-400 text-sm">
                      Drag & drop or click to browse your audio files
                    </p>
                  </div>
                </div>

                {/* Step 2 - Select */}
                <div className="group text-center">
                  <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 group-hover:border-gray-700 transition-all duration-300">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-500 transition-colors duration-300">
                      <Settings className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Select separation type</h3>
                    <p className="text-gray-400 text-sm">
                      Choose from 2, 4, or custom stem separation
                    </p>
                  </div>
                </div>

                {/* Step 3 - Download */}
                <div className="group text-center">
                  <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 group-hover:border-gray-700 transition-all duration-300">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-500 transition-colors duration-300">
                      <ArrowDown className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Access your stems</h3>
                    <p className="text-gray-400 text-sm">
                      Listen to and download your separated tracks
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="max-w-2xl mx-auto">
              <div className="w-24 h-px bg-gray-700 mx-auto mb-8"></div>
              <FileUpload onFileSelected={handleFileSelected} disabled={isApiLoading} />
            </div>
          </div>
        )}
        
        {/* Model Selection Section */}
        {selectedFile && !(processedStems || originalAudioPath) && (
          <>
            <ModelSelection onSelectionChange={handleSeparationConfigChange} disabled={isApiLoading} />
            
            <div className="w-full max-w-4xl mx-auto mt-12 flex justify-center">
              <Button 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-white px-16 py-4 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
                disabled={isApiLoading || isProcessing || (separationConfig.mode === 'custom' && (!separationConfig.selectedCustomStems || separationConfig.selectedCustomStems.length === 0))}
                onClick={handleStartProcessing}
              >
                {isApiLoading ? 'Processing...' : 'Start Processing'}
              </Button>
            </div>
          </>
        )}
        
        {/* Results Section */}
        {showResults && (
          <>
            <ResultsView 
              originalAudioPath={originalAudioPath} 
              stems={processedStems} 
              backendUrl={config.BACKEND_URL} 
              diarizationResult={diarizationResult}
            />
            
            <div className="w-full max-w-2xl mx-auto mt-12 flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-400 rounded-full px-8 py-3 hover:scale-105 transition-all duration-300"
                disabled={isApiLoading}
              >
                Process Another Track
              </Button>
            </div>
          </>
        )}

        {/* Error Messages */}
        {apiError && !isProcessing && (
           <div className="w-full max-w-2xl mx-auto mt-8 text-center">
              <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6">
                <p className="text-red-400 text-sm">Error: {apiError}</p>
              </div>
           </div>
        )}
      </main>
      
      {/* Processing Modal */}
      <ProcessingScreen 
        isVisible={isProcessing} 
        onComplete={handleProcessingComplete} 
      />
      
      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-500 border-t border-gray-800/50">
        <p>Stemuc Audio Forge &copy; {new Date().getFullYear()} - Powered by AI</p>
      </footer>
    </div>
  );
};

export default Index;
