import React from 'react';
import { Check, Circle } from 'lucide-react';
import { Step } from '../types';

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className={`flex items-center space-x-2 cursor-pointer transition-all duration-200 ${
                  step.completed || step.active ? 'text-blue-600' : 'text-gray-400'
                }`}
                onClick={() => onStepClick(step.id)}
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                  step.completed 
                    ? 'bg-blue-600 text-white' 
                    : step.active 
                      ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-50' 
                      : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.completed ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Circle className={`w-3 h-3 ${step.active ? 'fill-current' : ''}`} />
                  )}
                </div>
                <div className="hidden md:block">
                  <div className={`text-sm font-medium ${
                    step.completed || step.active ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition-all duration-200 ${
                  steps[index + 1].completed || step.completed ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stepper;