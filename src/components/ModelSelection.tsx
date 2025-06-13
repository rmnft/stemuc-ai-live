import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Music, Layers, Settings2, Info, Mic, Guitar, Piano, Drum, Music2, Volume2, Lock, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SeparationMode = "2-stem" | "4-stem" | "custom";
export interface ModelSelectionValue {
  mode: SeparationMode;
  // selectedStems é relevante apenas se mode === "custom"
  selectedCustomStems?: string[]; 
  // Nova opção para diarização
  enableDiarization?: boolean;
}

interface ModelSelectionProps {
  onSelectionChange: (value: ModelSelectionValue) => void;
  disabled?: boolean;
}

// Stems disponíveis no modelo de 6 stems (htdemucs_6s)
const SIX_STEM_OPTIONS = [
  { id: "vocals", name: "Vocals", icon: <Mic className="w-4 h-4" /> },
  { id: "guitar", name: "Guitar", icon: <Guitar className="w-4 h-4" /> },
  { id: "bass", name: "Bass", icon: <Music2 className="w-4 h-4" /> },
  { id: "drums", name: "Drums", icon: <Drum className="w-4 h-4" /> },
  { id: "piano", name: "Piano", icon: <Piano className="w-4 h-4" /> },
  { id: "other", name: "Other", icon: <Volume2 className="w-4 h-4" /> },
];

// Stems "bloqueados" (explicados via tooltip)
const LOCKED_STEMS_INFO = [
    { name: "Keys", icon: <Piano className="w-4 h-4" />, reason: "Included in 'Other' with 6-stem model"},
    { name: "Wind", icon: <Volume2 className="w-4 h-4" />, reason: "Included in 'Other' with 6-stem model"},
    { name: "Strings", icon: <Music className="w-4 h-4" />, reason: "Included in 'Other' with 6-stem model"},
]

const ModelSelection: React.FC<ModelSelectionProps> = ({ onSelectionChange, disabled }) => {
  const [currentMode, setCurrentMode] = useState<SeparationMode>("4-stem");
  const [customStems, setCustomStems] = useState<string[]>([]);
  const [enableDiarization, setEnableDiarization] = useState<boolean>(false);

  const hasVocals = () => {
    if (currentMode === "2-stem" || currentMode === "4-stem") {
      return true; // Estes modos sempre incluem vocais
    }
    if (currentMode === "custom") {
      return customStems.includes("vocals");
    }
    return false;
  };

  const handleModeChange = (newMode: SeparationMode) => {
    setCurrentMode(newMode);
    if (newMode === "custom") {
      // Quando custom é selecionado, podemos pré-selecionar alguns ou deixar vazio
      // Se customStems já tem algo, mantém, senão pode iniciar com vocals por exemplo.
      const initialCustom = customStems.length > 0 ? customStems : [SIX_STEM_OPTIONS[0].id];
      setCustomStems(initialCustom);
      onSelectionChange({ mode: newMode, selectedCustomStems: initialCustom, enableDiarization });
    } else {
      onSelectionChange({ mode: newMode, enableDiarization });
    }
  };

  const handleCustomStemToggle = (stemId: string, checked: boolean) => {
    const newCustomStems = checked 
      ? [...customStems, stemId] 
      : customStems.filter(s => s !== stemId);
    setCustomStems(newCustomStems);
    onSelectionChange({ mode: "custom", selectedCustomStems: newCustomStems, enableDiarization });
  };

  const handleDiarizationToggle = (checked: boolean) => {
    setEnableDiarization(checked);
    onSelectionChange({ 
      mode: currentMode, 
      selectedCustomStems: currentMode === "custom" ? customStems : undefined,
      enableDiarization: checked 
    });
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-3xl mx-auto my-6 p-4">
        {/* Basic Separation Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Basic separation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 4 Stems Option */}
            <div
              onClick={() => handleModeChange("4-stem")}
              className={cn(
                "relative p-4 rounded-xl cursor-pointer transition-all duration-200 border",
                currentMode === "4-stem" 
                  ? "bg-gray-200 border-red-500 text-black" 
                  : "bg-gray-800 border-gray-600 text-white hover:border-gray-500",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center">
                <Layers className="w-5 h-5 mr-3" />
                <div>
                  <h3 className="text-base font-medium">Vocals, Drums, Bass, Other</h3>
                  <p className={cn(
                    "text-xs",
                    currentMode === "4-stem" ? "text-gray-600" : "text-gray-400"
                  )}>4 Tracks</p>
                </div>
              </div>
            </div>

            {/* 2 Stems Option */}
            <div
              onClick={() => handleModeChange("2-stem")}
              className={cn(
                "relative p-4 rounded-xl cursor-pointer transition-all duration-200 border",
                currentMode === "2-stem" 
                  ? "bg-gray-200 border-red-500 text-black" 
                  : "bg-gray-800 border-gray-600 text-white hover:border-gray-500",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center">
                <Music className="w-5 h-5 mr-3" />
                <div>
                  <h3 className="text-base font-medium">Vocals, Instrumental</h3>
                  <p className={cn(
                    "text-xs",
                    currentMode === "2-stem" ? "text-gray-600" : "text-gray-400"
                  )}>2 Tracks</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Separation Section */}
        <div>
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-semibold text-white mr-2">Custom separation</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Select specific instruments to separate</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Available Stems */}
            {SIX_STEM_OPTIONS.map(stem => (
              <div
                key={stem.id}
                onClick={() => {
                  if (currentMode !== "custom") {
                    setCurrentMode("custom");
                    const newStems = [stem.id];
                    setCustomStems(newStems);
                    onSelectionChange({ mode: "custom", selectedCustomStems: newStems });
                  } else {
                    const isSelected = customStems.includes(stem.id);
                    handleCustomStemToggle(stem.id, !isSelected);
                  }
                }}
                className={cn(
                  "relative p-3 rounded-lg cursor-pointer transition-all duration-200 border flex flex-col items-center text-center",
                  currentMode === "custom" && customStems.includes(stem.id)
                    ? "bg-gray-700 border-red-500 text-white" 
                    : "bg-gray-800 border-gray-600 text-white hover:border-gray-500",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="mb-2 text-gray-300">
                  {stem.icon}
                </div>
                <h3 className="text-xs font-medium">{stem.name}</h3>
                {currentMode === "custom" && customStems.includes(stem.id) && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
            ))}

            {/* Locked Stems */}
            {LOCKED_STEMS_INFO.map(stem => (
              <Tooltip key={stem.name}>
                <TooltipTrigger asChild>
                  <div className="relative p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-500 flex flex-col items-center text-center cursor-not-allowed opacity-50">
                    <div className="mb-2">
                      {stem.icon}
                    </div>
                    <h3 className="text-xs font-medium">{stem.name}</h3>
                    <Lock className="absolute top-1 right-1 w-3 h-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stem.reason}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Voice Diarization Section */}
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-semibold text-white mr-2">Voice Diarization</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Separate different singers/artists within the vocal track</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div 
            className={cn(
              "relative p-4 rounded-xl border transition-all duration-200",
              hasVocals() 
                ? "bg-gray-800 border-gray-600 cursor-pointer hover:border-gray-500" 
                : "bg-gray-900 border-gray-700 opacity-50 cursor-not-allowed",
              enableDiarization && hasVocals() && "border-blue-500 bg-gray-700"
            )}
            onClick={() => {
              if (hasVocals() && !disabled) {
                handleDiarizationToggle(!enableDiarization);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3 text-blue-400" />
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h3 className={cn(
                      "text-base font-medium mr-2",
                      hasVocals() ? "text-white" : "text-gray-500"
                    )}>
                      Separate Multiple Artists
                    </h3>
                    {enableDiarization && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs",
                    hasVocals() ? "text-gray-400" : "text-gray-600"
                  )}>
                    {hasVocals() 
                      ? "Split vocal track by different singers/artists" 
                      : "Requires vocals to be selected"}
                  </p>
                </div>
              </div>
              
              {!hasVocals() && (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
            </div>

            {enableDiarization && hasVocals() && (
              <div className="mt-3 p-3 bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center text-blue-300 text-sm">
                  <Info className="w-4 h-4 mr-2" />
                  <span>Additional artists will be saved as separate files</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ModelSelection;
