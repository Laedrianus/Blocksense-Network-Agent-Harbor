import React, { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Step, SystemStatus, CheckState, TaskDetails, TaskFile } from './types';
import SystemCheckStep from './components/SystemCheckStep';
import SelectAgentStep from './components/SelectAgentStep';
import SetupStep from './components/SetupStep';
import ApiKeyStep from './components/ApiKeyStep';
import CreateTaskStep from './components/CreateTaskStep';
import TimelineStep from './components/TimelineStep';
import ParallelTasksStep from './components/ParallelTasksStep';
import TaskDashboardStep from './components/TaskDashboardStep';
import SummaryStep from './components/SummaryStep';
import StepIndicator from './components/StepIndicator';
import LeftInfoPanel from './components/LeftInfoPanel';
import RightInfoPanel from './components/RightInfoPanel';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<Step>(Step.SystemCheck);
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<string>('openhands');

    const initialSystemStatus: SystemStatus = {
        git: CheckState.Pending,
        docker: CheckState.Pending,
        vscode: CheckState.Pending,
        nix: CheckState.Pending,
        dockerError: null,
        os: undefined,
    };
    const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);

    const initialTaskDetails: TaskDetails = {
        branchName: '',
        description: '',
        pushToRemote: false,
    };
    const [taskDetails, setTaskDetails] = useState<TaskDetails>(initialTaskDetails);

    const [apiKey, setApiKey] = useState<string>('');
    const [lastTaskFile, setLastTaskFile] = useState<TaskFile | null>(null);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

    useEffect(() => {
        const socket = io(); // Connect to the server via the proxy
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
            socket.emit('config:get');
        });

        socket.on('config:data', (config: any) => {
            if (config.apiKey) {
                setApiKey(config.apiKey);
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const goToNextStep = useCallback(() => {
        if (currentStep === Step.Summary) return;

        let nextStep = currentStep + 1;

        if (selectedAgent === 'copilot' && currentStep === Step.Setup) {
            nextStep = Step.Summary;
        } else if (selectedAgent === 'jules' && currentStep === Step.ApiKey) {
            nextStep = Step.Summary;
        }

        setCurrentStep(nextStep as Step);
    }, [currentStep, selectedAgent]);


    const goToPreviousStep = useCallback(() => {
        if (currentStep === Step.SystemCheck) return;

        let prevStep = currentStep - 1;

        if (selectedAgent === 'copilot' && currentStep === Step.Summary) {
            prevStep = Step.Setup;
        } else if (selectedAgent === 'jules' && currentStep === Step.Summary) {
            prevStep = Step.ApiKey;
        }

        setCurrentStep(prevStep as Step);
    }, [currentStep, selectedAgent]);

    const handleSelectAgent = (agentId: string) => {
        setSelectedAgent(agentId);
        setCurrentStep(Step.Setup);
    };

    const resetWizard = useCallback(() => {
        setSystemStatus(initialSystemStatus);
        setTaskDetails(initialTaskDetails);
        setApiKey('');
        setSelectedAgent('openhands');
        setCurrentStep(Step.SystemCheck);
    }, []);

    const renderStep = () => {
        if (!isConnected) {
            return (
                <div className="text-center p-8">
                    <h2 className="text-xl font-bold text-yellow-500">Connecting to Backend...</h2>
                    <p className="text-slate-400 mt-2">Please ensure the server is running.</p>
                </div>
            )
        }

        switch (currentStep) {
            case Step.SystemCheck:
                return <SystemCheckStep
                    status={systemStatus}
                    setStatus={setSystemStatus}
                    onComplete={goToNextStep}
                    socket={socketRef.current!}
                />;
            case Step.SelectAgent:
                return <SelectAgentStep onSelect={handleSelectAgent} onBack={goToPreviousStep} socket={socketRef.current!} selectedAgent={selectedAgent} />;
            case Step.Setup:
                return <SetupStep onComplete={goToNextStep} onBack={goToPreviousStep} socket={socketRef.current!} />;
            case Step.ApiKey:
                return <ApiKeyStep apiKey={apiKey} setApiKey={setApiKey} onComplete={goToNextStep} onBack={goToPreviousStep} selectedAgent={selectedAgent} />;
            case Step.CreateTask:
                return <CreateTaskStep
                    details={taskDetails}
                    setDetails={setTaskDetails}
                    onComplete={(taskId) => {
                        if (taskId) setCurrentTaskId(taskId);
                        goToNextStep();
                    }}
                    onBack={goToPreviousStep}
                    socket={socketRef.current!}
                    selectedAgent={selectedAgent}
                    setLastTaskFile={setLastTaskFile}
                />;
            case Step.Timeline:
                return <TimelineStep
                    socket={socketRef.current!}
                    onBack={goToPreviousStep}
                    onNext={goToNextStep}
                />;
            case Step.ParallelTasks:
                return <ParallelTasksStep
                    socket={socketRef.current!}
                    onBack={goToPreviousStep}
                    onNext={goToNextStep}
                    selectedAgent={selectedAgent}
                />;
            case Step.TaskMonitor:
                return <TaskDashboardStep
                    socket={socketRef.current!}
                    onBack={goToPreviousStep}
                    onComplete={goToNextStep}
                    initialTaskId={currentTaskId || undefined}
                    onCreateNewTask={() => setCurrentStep(Step.CreateTask)}
                />;
            case Step.Summary:
                return <SummaryStep onReset={resetWizard} onBack={goToPreviousStep} selectedAgent={selectedAgent} lastTaskFile={lastTaskFile} branchName={taskDetails.branchName} />;
            default:
                return <div>Unknown Step</div>;
        }
    };

    return (
        <div className="h-screen flex flex-col font-sans overflow-hidden bg-slate-50">
            <header className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="text-center">
                        {/* Logo and Title Section */}
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <img
                                src="/agentlogo.svg"
                                alt="Agent Harbor Logo"
                                className="h-10 w-10"
                            />
                            <div className="text-left">
                                <h1 className="text-lg md:text-xl font-bold tracking-tight text-gray-900">
                                    Blocksense Network Agent Harbor
                                </h1>
                                <p className="text-xs text-gray-600 font-medium">
                                    Management GUI WIZARD
                                </p>
                            </div>
                        </div>

                        {/* Step Indicator */}
                        <StepIndicator currentStep={currentStep} selectedAgent={selectedAgent} />
                    </div>
                </div>
            </header>

            <main className="flex-grow flex overflow-hidden">
                <div className="w-full max-w-8xl mx-auto flex py-8 px-4 sm:px-6 lg:px-8 gap-8">

                    {/* Left Info Panel */}
                    <aside className="hidden lg:block w-1/4 flex-shrink-0">
                        <LeftInfoPanel currentStep={currentStep} selectedAgent={selectedAgent} os={systemStatus.os} />
                    </aside>

                    {/* Main Content */}
                    <div className="flex-grow bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto">
                        <div className="p-6 sm:p-8 h-full">
                            <ErrorBoundary>
                                {renderStep()}
                            </ErrorBoundary>
                        </div>
                    </div>

                    {/* Right Info Panel */}
                    <aside className="hidden lg:block w-1/4 flex-shrink-0">
                        <RightInfoPanel currentStep={currentStep} selectedAgent={selectedAgent} os={systemStatus.os} />
                    </aside>

                </div>
            </main>
        </div>
    );
};

export default App;