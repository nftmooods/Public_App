import React from 'react';
import { Check, Circle, Lock, RotateCcw, Home, Play, Settings, LayoutDashboard, ToggleLeft, ToggleRight } from 'lucide-react';
import { Step } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  const { resetAppState } = useAppContext();

  const canNavigateToStep = (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    const completedSteps = steps.filter(s => s.completed).map(s => s.id);
    const maxCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
    
    return step?.completed || stepId <= maxCompletedStep + 1;
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Rekapp</h1>
            <p className="text-xs text-gray-400">Transform content</p>
          </div>
        </div>

      </div>

      {/* Steps */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {steps.map((step, index) => {
            const canNavigate = canNavigateToStep(step.id);
            const isActive = step.id === currentStep;
            
            return (
              <div key={step.id} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={`absolute left-4 top-10 w-0.5 h-8 ${
                    step.completed ? 'bg-blue-500' : 
                    !isProductionMode ? 'bg-yellow-400' : 'bg-gray-600'
                  }`} />
                )}
                
                <div 
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : canNavigate 
                        ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
                        : 'opacity-50 cursor-not-allowed text-gray-500'
                  }`}
                  onClick={() => canNavigate && onStepClick(step.id)}
                >
                  {/* Step indicator */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-white text-blue-600' 
                        : canNavigate
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-800 text-gray-600'
                  }`}>
                    {step.completed ? (
                      <Check className="w-4 h-4" />
                    ) : !canNavigate ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  
                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${
                      isActive ? 'text-white' : 
                      step.completed ? 'text-gray-200' : 
                      canNavigate ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isActive ? 'text-blue-100' : 
                      step.completed ? 'text-gray-400' : 
                      canNavigate ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </div>
                    
                    {/* Status indicators */}
                    {isActive && (
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-100 font-medium">Current</span>
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
      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart Step
        </button>
        
        <button
          onClick={resetAppState}
          className="w-full flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm"
        >
          <Home className="w-4 h-4 mr-2" />
          Start Over
        </button>
      </div>
    </div>
  );
};

export default Stepper;