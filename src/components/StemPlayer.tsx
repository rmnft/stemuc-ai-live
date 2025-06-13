
import { useState, useRef } from 'react';
import { Play, Pause, Download, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface StemPlayerProps {
  stemName: string;
  stemColor: string;
  shortName?: string;
  audioUrl?: string; // Will be used when connected to backend
}

const StemPlayer: React.FC<StemPlayerProps> = ({ 
  stemName, 
  stemColor,
  shortName,
  audioUrl
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(100); // Default value until audio is loaded
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Generate a fake waveform pattern for visualization
  const generateWaveform = (length: number) => {
    return Array.from({ length }, () => Math.random() * 0.8 + 0.2);
  };
  
  const waveformData = generateWaveform(100);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, you would play/pause the audio here
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  const handleDownload = () => {
    // In a real implementation, you would trigger the download here
    console.log(`Downloading ${stemName}`);
  };
  
  return (
    <div className="glass-card rounded-lg overflow-hidden">
      <div className="flex">
        {/* Stem info sidebar */}
        <div className="w-[70px] bg-black/60 p-4 flex flex-col items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-md flex items-center justify-center" 
                 style={{ backgroundColor: stemColor }}>
              <span className="text-black font-bold">{shortName || stemName[0]}</span>
            </div>
            <p className="text-xs text-center mt-2">{stemName}</p>
          </div>
          
          <div className="flex flex-col items-center">
            {/* Volume controls */}
            <div className="transform rotate-270 mt-10">
              <Slider
                orientation="vertical"
                value={[volume]}
                max={1}
                min={0}
                step={0.01}
                className="h-16"
                onValueChange={handleVolumeChange}
              />
            </div>
            <Volume2 className="h-4 w-4 text-muted-foreground mt-2" />
          </div>
        </div>
        
        {/* Main waveform area */}
        <div className="flex-1 p-2">
          <div className="relative h-24">
            {/* Waveform visualization */}
            <div className="absolute inset-0 flex items-center">
              {waveformData.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 mx-px"
                  style={{ 
                    height: `${height * 100}%`, 
                    backgroundColor: i / waveformData.length < currentTime / duration 
                      ? stemColor 
                      : 'rgba(255, 255, 255, 0.1)',
                    transition: 'height 0.3s ease'
                  }}
                />
              ))}
            </div>
            
            {/* Progress indicator */}
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              className="absolute inset-0 z-10 opacity-0"
              onValueChange={(value) => setCurrentTime(value[0])}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-black/50 border-white/20 hover:bg-white/10"
                onClick={togglePlayPause}
              >
                {isPlaying 
                  ? <Pause className="h-4 w-4 text-white" /> 
                  : <Play className="h-4 w-4 text-white" />}
              </Button>
              <span className="text-xs text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-white"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time in MM:SS
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default StemPlayer;
