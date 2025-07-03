import React from 'react';
import { Check, Circle, Lock, RotateCcw, Home } from 'lucide-react';
import { Step } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  demoMode?: boolean;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick, demoMode = false }) => {
  const { resetAppState, isProductionMode, setAppState, appState } = useAppContext();

  const canNavigateToStep = (stepId: number) => {
    if (demoMode) {
      // In demo mode, you can navigate to all steps
      return true;
    }
    
    // In production mode, you can navigate to completed steps or the next available step
    const step = steps.find(s => s.id === stepId);
    const completedSteps = steps.filter(s => s.completed).map(s => s.id);
    const maxCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
    
    // Allow navigation to completed steps or the next step after the highest completed step
    return step?.completed || stepId <= maxCompletedStep + 1;
  };

  const handleRestartCurrentStep = () => {
    console.log('🔄 Restarting current step while preserving production mode');
    
    // Store current mode before restart
    const currentMode = isProductionMode;
    
    // Reset the current step's state while preserving mode and completed steps
    setAppState(prev => {
      const resetState = { ...prev };
      
      // Clear processing state
      resetState.isProcessing = false;
      
      // Based on current step, reset specific data
      switch (currentStep) {
        case 1:
          // Reset input data but keep mode
          resetState.audioUrl = '';
          resetState.youtubeUrl = '';
          resetState.audioFile = null;
          resetState.textContent = '';
          resetState.textFile = null;
          resetState.transcription = null;
          resetState.keyPoints = [];
          break;
        case 2:
          // Keep transcription but reset processing
          resetState.isProcessing = false;
          break;
        case 3:
          // Reset content settings to defaults
          resetState.contentSettings = {
            ...resetState.contentSettings,
            title: '',
            subtitle: '',
            summary: ''
          };
          break;
        case 4:
          // Reset format and tone to defaults
          resetState.contentSettings = {
            ...resetState.contentSettings,
            format: 'article',
            tone: 'professional'
          };
          break;
        case 5:
          // Reset generated content
          resetState.generatedContent = '';
          resetState.isProcessing = false;
          break;
        case 6:
          // Nothing specific to reset for export step
          break;
        default:
          break;
      }
      
      return resetState;
    });
    
    console.log(`✅ Current step ${currentStep} restarted, production mode preserved: ${currentMode}`);
  };

  return (
    <div className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto">
        {/* Mode indicator and controls at the top */}
        <div className="flex justify-between items-center mb-4">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
            demoMode 
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
              : 'bg-green-100 text-green-800 border border-green-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              demoMode ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
            <span>
              {demoMode ? '🎭 DEMO MODE - Free navigation' : '🚀 PRODUCTION MODE - Sequential navigation'}
            </span>
          </div>

          {/* Step Control Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRestartCurrentStep}
              className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm"
              title="Restart current step"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Restart Step
            </button>
            
            <button
              onClick={resetAppState}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm"
              title="Start over from the beginning"
            >
              <Home className="w-4 h-4 mr-1" />
              Start Over
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const canNavigate = canNavigateToStep(step.id);
            const isActive = step.id === currentStep;
            
            return (
              <React.Fragment key={step.id}>
                <div 
                  className={`flex items-center space-x-3 transition-all duration-200 ${
                    canNavigate ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  } ${
                    step.completed || isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}
                  onClick={() => canNavigate && onStepClick(step.id)}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 relative ${
                    step.completed 
                      ? 'bg-blue-600 text-white' 
                      : isActive 
                        ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-50' 
                        : canNavigate
                          ? 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                          : 'bg-gray-100 text-gray-300'
                  }`}>
                    {step.completed ? (
                      <Check className="w-4 h-4" />
                    ) : !canNavigate && !demoMode ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Circle className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
                    )}
                    
                    {/* Special indicator for demo mode */}
                    {demoMode && !step.completed && !isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
                    )}
                  </div>
                  
                  <div className="hidden md:block">
                    <div className={`text-sm font-medium ${
                      step.completed || isActive ? 'text-gray-900' : canNavigate ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className={`text-xs ${
                      step.completed || isActive ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {step.description}
                    </div>
                    
                    {/* Availability indicator */}
                    {demoMode && !step.completed && !isActive && (
                      <div className="text-xs text-yellow-600 font-medium">
                        Click to access
                      </div>
                    )}
                    
                    {!canNavigate && !demoMode && !step.completed && !isActive && (
                      <div className="text-xs text-gray-400">
                        Locked
                      </div>
                    )}
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 transition-all duration-200 ${
                    steps[index + 1].completed || step.completed ? 'bg-blue-600' : 
                    demoMode ? 'bg-yellow-300' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* Legend at the bottom */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-100 border border-blue-600 rounded-full"></div>
              <span>Current</span>
            </div>
            {demoMode ? (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Available (demo)</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <Lock className="w-2 h-2" />
                <span>Locked</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <RotateCcw className="w-2 h-2" />
              <span>Restart Step</span>
            </div>
            <div className="flex items-center space-x-1">
              <Home className="w-2 h-2" />
              <span>Start Over</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stepper;