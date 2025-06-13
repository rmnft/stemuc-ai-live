import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Music2, Disc3, Play, Pause, Volume2, VolumeX, RotateCcw, Mic, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface DiarizationData {
  enabled: boolean;
  method?: string;
  num_artists: number;
  artists: Record<string, string>;
  message?: string;
  error?: string;
}

interface ResultsViewProps {
  originalAudioPath: string | null;
  stems: string[] | null;
  backendUrl: string;
  diarizationResult?: DiarizationData | null;
}

interface AudioTrack {
  name: string;
  url: string;
  color: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  type: 'stem' | 'artist';
}

const ResultsView: React.FC<ResultsViewProps> = ({ originalAudioPath, stems, backendUrl, diarizationResult }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Se não houver nem original nem stems, não mostrar nada ou uma mensagem específica
  if (!originalAudioPath && (!stems || stems.length === 0)) {
    return (
      <div className="w-full max-w-4xl mx-auto my-8 text-center">
        <p className="text-gray-400">No audio results available to display.</p>
      </div>
    );
  }

  // Initialize tracks when stems are loaded
  useEffect(() => {
    if (stems && stems.length > 0) {
      const colors = ['#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'];
      const artistColors = ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];
      
      let initialTracks: AudioTrack[] = [];
      
      // Adicionar stems regulares (exceto vocals se houver diarização com múltiplos artistas)
      const hasMultipleArtists = diarizationResult?.enabled && 
                                diarizationResult?.num_artists > 1 && 
                                diarizationResult?.artists && 
                                Object.keys(diarizationResult.artists).length > 0;
      
      stems.forEach((stemPath, index) => {
        const name = getStemDisplayName(stemPath);
        // Se há múltiplos artistas detectados e este é o stem de vocals, não adicionar
        // porque vamos adicionar os artistas individuais
        if (hasMultipleArtists && name.toLowerCase().includes('vocal')) {
          return;
        }
        
        initialTracks.push({
          name,
          url: `${backendUrl}/stems/${stemPath}`,
          color: colors[index % colors.length],
          volume: 100,
          isMuted: false,
          isSolo: false,
          type: 'stem',
        });
      });
      
      // Adicionar artistas individuais se diarização detectou múltiplos
      if (hasMultipleArtists) {
        Object.entries(diarizationResult.artists).forEach(([artistKey, artistPath], index) => {
          initialTracks.push({
            name: `🎤 ${artistKey.replace('artist_', 'Artist ')}`,
            url: `${backendUrl}/stems/${artistPath}`,
            color: artistColors[index % artistColors.length],
            volume: 100,
            isMuted: false,
            isSolo: false,
            type: 'artist',
          });
        });
      }
      
      setTracks(initialTracks);
    }
  }, [stems, backendUrl, diarizationResult]);

  // Function to get a display name from the stem path
  const getStemDisplayName = (path: string): string => {
    const filename = path.split('/').pop() || 'unknown_stem.wav';
    return filename.replace(/\.(wav|mp3|flac|ogg)$/i, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const togglePlayPause = useCallback(() => {
    Object.values(audioRefs.current).forEach(audio => {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(console.error);
      }
    });
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const updateTrack = useCallback((index: number, updates: Partial<AudioTrack>) => {
    setTracks(prev => prev.map((track, i) => i === index ? { ...track, ...updates } : track));
  }, []);

  const toggleMute = useCallback((index: number) => {
    const track = tracks[index];
    const audio = audioRefs.current[track.url];
    if (audio) {
      audio.muted = !track.isMuted;
    }
    updateTrack(index, { isMuted: !track.isMuted });
  }, [tracks, updateTrack]);

  const toggleSolo = useCallback((index: number) => {
    const newTracks = tracks.map((track, i) => {
      if (i === index) {
        return { ...track, isSolo: !track.isSolo };
      }
      return track;
    });
    
    const hasSolo = newTracks.some(track => track.isSolo);
    
    Object.entries(audioRefs.current).forEach(([url, audio]) => {
      const trackIndex = tracks.findIndex(t => t.url === url);
      if (trackIndex !== -1) {
        const track = newTracks[trackIndex];
        audio.muted = hasSolo ? !track.isSolo : track.isMuted;
      }
    });
    
    setTracks(newTracks);
  }, [tracks]);

  const changeVolume = useCallback((index: number, volume: number) => {
    const track = tracks[index];
    const audio = audioRefs.current[track.url];
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume / 100));
    }
    updateTrack(index, { volume });
  }, [tracks, updateTrack]);

  const changeSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    Object.values(audioRefs.current).forEach(audio => {
      audio.playbackRate = speed;
    });
  }, []);

  const seekTo = useCallback((time: number) => {
    const validTime = Math.max(0, Math.min(time, duration));
    Object.values(audioRefs.current).forEach(audio => {
      audio.currentTime = validTime;
    });
    setCurrentTime(validTime);
  }, [duration]);

  const formatTime = useCallback((time: number) => {
    if (!time || isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackSpeed(1);
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = 1;
    });
  }, []);

  // Calculate progress percentage safely
  const getProgressPercent = useCallback(() => {
    if (!duration || duration <= 0 || !currentTime || currentTime < 0) return 0;
    const percent = (currentTime / duration) * 100;
    return Math.max(0, Math.min(100, percent));
  }, [currentTime, duration]);

  // Handle seek on timeline
  const handleTimelineSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    seekTo(percentage * duration);
  }, [duration, seekTo]);

  // Handle seek on individual track waveform
  const handleTrackSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    seekTo(percentage * duration);
  }, [duration, seekTo]);

  // Generate simple waveform bars (memoized for performance)
  const generateWaveformBars = useCallback((trackIndex: number) => {
    const bars = [];
    const numBars = 40; // Further reduced for better performance
    
    for (let i = 0; i < numBars; i++) {
      const baseHeight = 25 + (trackIndex * 3);
      const variation = Math.sin((i + trackIndex) * 0.3) * 10 + Math.sin(i * 0.8) * 5;
      const height = Math.max(15, Math.min(85, baseHeight + variation));
      bars.push(height);
    }
    
    return bars;
  }, []);

  // Separar tracks por tipo
  const stemTracks = tracks.filter(track => track.type === 'stem');
  const artistTracks = tracks.filter(track => track.type === 'artist');
  const hasArtists = artistTracks.length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto my-6 p-4 bg-black text-white">
      {/* Diarization Info */}
      {diarizationResult?.enabled && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Voice Diarization Results</h3>
          </div>
          <div className="text-sm text-gray-300">
            <p>Method: <span className="text-blue-400">{diarizationResult.method || 'Unknown'}</span></p>
            <p>Artists detected: <span className="text-green-400">{diarizationResult.num_artists}</span></p>
            {diarizationResult.message && (
              <p className="text-yellow-400 mt-1">{diarizationResult.message}</p>
            )}
            {diarizationResult.error && (
              <p className="text-red-400 mt-1">Error: {diarizationResult.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Audio Elements (Hidden) */}
      {tracks.map((track, index) => (
        <audio
          key={track.url}
          ref={el => {
            if (el) audioRefs.current[track.url] = el;
          }}
          onLoadedMetadata={(e) => {
            if (index === 0) {
              const audioDuration = e.currentTarget.duration;
              if (!isNaN(audioDuration) && audioDuration > 0) {
                setDuration(audioDuration);
              }
            }
          }}
          onTimeUpdate={(e) => {
            if (index === 0 && !isDragging) {
              const audioCurrentTime = e.currentTarget.currentTime;
              if (!isNaN(audioCurrentTime) && audioCurrentTime >= 0) {
                setCurrentTime(audioCurrentTime);
              }
            }
          }}
          onEnded={() => {
            if (index === 0) {
              setIsPlaying(false);
            }
          }}
          preload="metadata"
        >
          <source src={track.url} type="audio/wav" />
        </audio>
      ))}

      {/* Main Timeline */}
      <div className="mb-6">
        <div 
          className="h-1 bg-gray-800 rounded-full mb-2 cursor-pointer relative overflow-hidden" 
          onClick={handleTimelineSeek}
        >
          <div 
            className="h-full bg-red-500 rounded-full transition-all duration-75"
            style={{ width: `${getProgressPercent()}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Artists Section */}
      {hasArtists && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Mic className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Individual Artists</h3>
          </div>
          <div className="space-y-3">
            {artistTracks.map((track, index) => {
              const waveformBars = generateWaveformBars(index);
              const progressPercent = getProgressPercent();
              const trackIndex = tracks.indexOf(track);
              
              return (
                <div key={track.url} className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-700/30 rounded-lg p-3">
                  {/* Track Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleMute(trackIndex)}
                          className={cn(
                            "w-6 h-6 rounded text-xs font-bold transition-colors",
                            track.isMuted ? "bg-red-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                          )}
                        >
                          M
                        </button>
                        <button
                          onClick={() => toggleSolo(trackIndex)}
                          className={cn(
                            "w-6 h-6 rounded text-xs font-bold transition-colors",
                            track.isSolo ? "bg-yellow-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                          )}
                        >
                          S
                        </button>
                      </div>
                      <span className="text-white font-medium text-sm min-w-[80px]">{track.name}</span>
                      <div className="flex items-center space-x-2">
                        <VolumeX className="w-3 h-3 text-gray-400" />
                        <div className="w-16">
                          <Slider
                            value={[track.volume]}
                            onValueChange={(value) => changeVolume(trackIndex, value[0])}
                            max={100}
                            step={1}
                            className="cursor-pointer"
                          />
                        </div>
                        <Volume2 className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={track.url} download>
                        <Download className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>

                  {/* Waveform */}
                  <div 
                    className="h-12 rounded overflow-hidden relative cursor-pointer"
                    style={{ backgroundColor: `${track.color}15` }}
                    onClick={handleTrackSeek}
                    onMouseDown={(e) => {
                      setIsDragging(true);
                      handleTrackSeek(e);
                    }}
                    onMouseMove={(e) => {
                      if (isDragging) {
                        handleTrackSeek(e);
                      }
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  >
                    {/* Waveform bars */}
                    <div className="flex items-end h-full px-1 gap-1">
                      {waveformBars.map((height, barIndex) => {
                        const isPlayed = barIndex < (progressPercent / 100 * waveformBars.length);
                        return (
                          <div
                            key={barIndex}
                            className="flex-1 rounded-sm transition-colors duration-75"
                            style={{
                              height: `${Math.max(10, height)}%`,
                              backgroundColor: isPlayed ? track.color : `${track.color}60`,
                              minHeight: '4px',
                              maxHeight: '100%'
                            }}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Progress line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white/80 pointer-events-none"
                      style={{ left: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instruments Section */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Music2 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Instruments</h3>
        </div>
        <div className="space-y-3">
          {stemTracks.map((track, index) => {
            const waveformBars = generateWaveformBars(index);
            const progressPercent = getProgressPercent();
            const trackIndex = tracks.indexOf(track);
            
            return (
              <div key={track.url} className="bg-gray-900 rounded-lg p-3">
                {/* Track Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleMute(trackIndex)}
                        className={cn(
                          "w-6 h-6 rounded text-xs font-bold transition-colors",
                          track.isMuted ? "bg-red-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                        )}
                      >
                        M
                      </button>
                      <button
                        onClick={() => toggleSolo(trackIndex)}
                        className={cn(
                          "w-6 h-6 rounded text-xs font-bold transition-colors",
                          track.isSolo ? "bg-yellow-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                        )}
                      >
                        S
                      </button>
                    </div>
                    <span className="text-white font-medium text-sm min-w-[60px]">{track.name}</span>
                    <div className="flex items-center space-x-2">
                      <VolumeX className="w-3 h-3 text-gray-400" />
                      <div className="w-16">
                        <Slider
                          value={[track.volume]}
                          onValueChange={(value) => changeVolume(trackIndex, value[0])}
                          max={100}
                          step={1}
                          className="cursor-pointer"
                        />
                      </div>
                      <Volume2 className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={track.url} download>
                      <Download className="h-3 w-3" />
                    </a>
                  </Button>
                </div>

                {/* Waveform */}
                <div 
                  className="h-12 rounded overflow-hidden relative cursor-pointer"
                  style={{ backgroundColor: `${track.color}15` }}
                  onClick={handleTrackSeek}
                  onMouseDown={(e) => {
                    setIsDragging(true);
                    handleTrackSeek(e);
                  }}
                  onMouseMove={(e) => {
                    if (isDragging) {
                      handleTrackSeek(e);
                    }
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                >
                  {/* Waveform bars */}
                  <div className="flex items-end h-full px-1 gap-1">
                    {waveformBars.map((height, barIndex) => {
                      const isPlayed = barIndex < (progressPercent / 100 * waveformBars.length);
                      return (
                        <div
                          key={barIndex}
                          className="flex-1 rounded-sm transition-colors duration-75"
                          style={{
                            height: `${Math.max(10, height)}%`,
                            backgroundColor: isPlayed ? track.color : `${track.color}60`,
                            minHeight: '4px',
                            maxHeight: '100%'
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Progress line */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white/80 pointer-events-none"
                    style={{ left: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            onClick={togglePlayPause}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <Button
            onClick={reset}
            variant="outline"
            size="lg"
            className="border-gray-600 text-white hover:bg-gray-800 px-4 py-2"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
          <span className="text-xs text-gray-400 mr-1">Speed:</span>
          {[0.5, 1, 2].map((speed) => (
            <button
              key={speed}
              onClick={() => changeSpeed(speed)}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                playbackSpeed === speed
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
