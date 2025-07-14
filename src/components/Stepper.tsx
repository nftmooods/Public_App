import React from 'react';
import { Check, Circle, Lock, RotateCcw, Home, Play, Settings } from 'lucide-react';
import { Step } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  demoMode?: boolean;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick, demoMode = false }) => {
  const { resetAppState, isProductionMode } = useAppContext();

  const canNavigateToStep = (stepId: number) => {
    if (demoMode) {
      return true;
    }
    
    const step = steps.find(s => s.id === stepId);
    const completedSteps = steps.filter(s => s.completed).map(s => s.id);
    const maxCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
    
    return step?.completed || stepId <= maxCompletedStep + 1;
  };

  const handleRestartCurrentStep = () => {
    console.log('🔄 Restarting current step while preserving production mode');
    // Logic handled in AppContext
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={resetAppState}
            className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all"
            title="New Analysis"
          >
            <span className="text-white font-bold">R</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Rekapp</h1>
            <p className="text-sm text-gray-500">Transform content</p>
          </div>
        </div>

        {/* Mode indicator */}
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
          demoMode 
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
            : 'bg-green-100 text-green-800 border border-green-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            demoMode ? 'bg-yellow-500' : 'bg-green-500'
          }`}></div>
          <span>
            {demoMode ? 'Demo Mode' : 'Production Mode'}
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const canNavigate = canNavigateToStep(step.id);
            const isActive = step.id === currentStep;
            
            return (
              <div key={step.id} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={`absolute left-4 top-10 w-0.5 h-12 ${
                    step.completed ? 'bg-blue-600' : 
                    demoMode ? 'bg-yellow-300' : 'bg-gray-200'
                  }`} />
                )}
                
                <div 
                  className={`flex items-start space-x-4 p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : canNavigate 
                        ? 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                        : 'opacity-50 cursor-not-allowed border-2 border-transparent'
                  }`}
                  onClick={() => canNavigate && onStepClick(step.id)}
                >
                  {/* Step indicator */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    step.completed 
                      ? 'bg-blue-600 text-white' 
                      : isActive 
                        ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-200' 
                        : canNavigate
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-gray-100 text-gray-300'
                  }`}>
                    {step.completed ? (
                      <Check className="w-4 h-4" />
                    ) : !canNavigate && !demoMode ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  
                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${
                      isActive ? 'text-blue-900' : 
                      step.completed ? 'text-gray-900' : 
                      canNavigate ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isActive ? 'text-blue-700' : 
                      step.completed ? 'text-gray-500' : 
                      canNavigate ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {step.description}
                    </div>
                    
                    {/* Status indicators */}
                    {isActive && (
                      <div className="flex items-center space-x-1 mt-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-600 font-medium">Current</span>
                      </div>
                    )}
                    
                    {demoMode && !step.completed && !isActive && canNavigate && (
                      <div className="text-xs text-yellow-600 font-medium mt-1">
                        Available
                      </div>
                    )}
                    
                    {!canNavigate && !demoMode && !step.completed && !isActive && (
                      <div className="text-xs text-gray-400 mt-1">
                        Locked
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-6 border-t border-gray-200 space-y-3">
        <button
          onClick={handleRestartCurrentStep}
          className="w-full flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm"
          title="Restart current step"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart Step
        </button>
        
        <button
          onClick={resetAppState}
          className="w-full flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm"
          title="Start over from the beginning"
        >
          <Home className="w-4 h-4 mr-2" />
          Start Over
        </button>
      </div>
    </div>
  );
};

export default Stepper;