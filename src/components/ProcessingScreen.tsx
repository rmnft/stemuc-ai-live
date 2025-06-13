
import React, { useState, useEffect } from 'react';
import { Loader, Music } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessingScreenProps {
  isVisible: boolean;
  onComplete: () => void;
}

const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ 
  isVisible, 
  onComplete 
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing...');
  
  // Simulate processing
  useEffect(() => {
    if (!isVisible) return;
    
    const stages = [
      { text: 'Uploading audio file...', targetProgress: 20 },
      { text: 'Initializing AI model...', targetProgress: 40 },
      { text: 'Processing audio...', targetProgress: 70 },
      { text: 'Separating stems...', targetProgress: 90 },
      { text: 'Finalizing output...', targetProgress: 100 }
    ];
    
    let currentStage = 0;
    
    const processStage = () => {
      if (currentStage < stages.length) {
        const stage = stages[currentStage];
        setStatusText(stage.text);
        
        // Simulate progress for current stage
        const startProgress = currentStage > 0 ? stages[currentStage - 1].targetProgress : 0;
        const increment = (stage.targetProgress - startProgress) / 10;
        let currentProgress = startProgress;
        
        const progressInterval = setInterval(() => {
          currentProgress += increment;
          setProgress(Math.min(Math.floor(currentProgress), stage.targetProgress));
          
          if (currentProgress >= stage.targetProgress) {
            clearInterval(progressInterval);
            currentStage++;
            
            if (currentStage < stages.length) {
              setTimeout(processStage, 500);
            } else {
              // Processing complete
              setTimeout(() => {
                onComplete();
              }, 1000);
            }
          }
        }, 200);
      }
    };
    
    // Start processing
    const timeoutId = setTimeout(processStage, 500);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isVisible, onComplete]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-card p-8 rounded-lg w-full max-w-md red-glow">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Music className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Processing Audio</h3>
          <p className="text-muted-foreground mb-6">{statusText}</p>
          
          <div className="space-y-2 mb-6">
            <Progress value={progress} className="h-2 bg-muted" />
            <p className="text-sm text-right text-muted-foreground">{progress}%</p>
          </div>
          
          <div className="wave-bars mx-auto">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div 
                key={i} 
                className="wave-bar animate-wave h-10" 
                style={{ 
                  animationDelay: `${i * 0.15}s`,
                  height: `${10 + Math.random() * 20}px`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingScreen;
