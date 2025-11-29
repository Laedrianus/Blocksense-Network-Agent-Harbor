import React from 'react';
import { Step } from '../types';

interface StepIndicatorProps {
    currentStep: Step;
    selectedAgent: string;
}

const CheckIcon: React.FC = () => (
    <svg className="h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
    </svg>
);

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, selectedAgent }) => {
    const allSteps = [
        { id: Step.SystemCheck, name: 'System Check' },
        { id: Step.SelectAgent, name: 'Select Agent' },
        { id: Step.Setup, name: 'Setup' },
        { id: Step.ApiKey, name: 'API Key' },
        { id: Step.CreateTask, name: 'Task' },
        { id: Step.TaskMonitor, name: 'Dashboard' },
        { id: Step.Summary, name: 'Summary' },
    ];

    const steps = allSteps.filter(step => {
        // Hide API key step for agents that don't need one in this flow
        if (step.id === Step.ApiKey && selectedAgent === 'copilot') {
            return false;
        }

        // Hide Create Task step for agents where the flow ends before that
        if (step.id === Step.CreateTask && ['copilot', 'jules'].includes(selectedAgent)) {
            return false;
        }

        return true;
    });

    const getStepStatus = (stepId: Step) => {
        if (stepId < currentStep) return 'completed';
        if (stepId === currentStep) return 'current';
        return 'upcoming';
    };

    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-start">
                {steps.map((step, stepIdx) => {
                    const status = getStepStatus(step.id);

                    const markerClasses = {
                        completed: 'bg-cyan-600',
                        current: 'border-2 border-cyan-500 bg-slate-800',
                        upcoming: 'border-2 border-slate-600 bg-slate-800',
                    }[status];

                    const textClasses = {
                        completed: 'text-cyan-400',
                        current: 'text-cyan-400 font-semibold',
                        upcoming: 'text-slate-500',
                    }[status];

                    return (
                        <li key={step.name} className="relative flex-1">
                            {/* Connecting line */}
                            {stepIdx < steps.length - 1 ? (
                                <div
                                    className={`absolute left-1/2 top-2.5 -ml-px h-0.5 w-full ${getStepStatus(steps[stepIdx + 1].id) === 'upcoming' ? 'bg-slate-700' : 'bg-cyan-600'}`}
                                    aria-hidden="true"
                                />
                            ) : null}

                            <div className="relative flex flex-col items-center text-center">
                                {/* Marker */}
                                <div className={`z-10 flex h-5 w-5 items-center justify-center rounded-full transition-colors ${markerClasses}`}>
                                    {status === 'completed' ? (
                                        <CheckIcon />
                                    ) : status === 'current' ? (
                                        <span className="h-2 w-2 rounded-full bg-cyan-500" />
                                    ) : null}
                                </div>

                                {/* Label */}
                                <p className={`mt-1.5 text-xs transition-colors ${textClasses}`}>{step.name}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default StepIndicator;