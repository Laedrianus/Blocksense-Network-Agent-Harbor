import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { SystemStatus, CheckState } from '../types';
import Spinner from './Spinner';
import { CheckCircleIcon, XCircleIcon, GitIcon, DockerIcon, VscodeIcon, NixIcon, InformationCircleIcon, AhIcon } from './IconComponents';

interface SystemCheckStepProps {
    status: SystemStatus;
    setStatus: React.Dispatch<React.SetStateAction<SystemStatus>>;
    onComplete: () => void;
    socket: Socket;
}

const ActionButton: React.FC<{ onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, disabled?: boolean, children: React.ReactNode, variant?: 'primary' | 'secondary' | 'link' }> =
    ({ onClick, disabled, children, variant = 'secondary' }) => {
        const colors = {
            primary: "bg-blue-600 hover:bg-blue-500 text-white",
            secondary: "bg-slate-200 hover:bg-slate-300 text-slate-700",
            link: "bg-transparent hover:bg-blue-50 text-blue-600"
        }[variant];
        return (
            <button onClick={onClick} disabled={disabled} className={`w-24 py-1 text-xs font-semibold rounded transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center ${colors}`}>
                {children}
            </button>
        )
    };

const InstallationGuide: React.FC<{ name: string }> = ({ name }) => {
    const gitSteps = [
        "Click the 'Download Git' button to go to the official download page.",
        "Download and run the installer for your operating system.",
        "During installation, you can safely accept the default settings by clicking 'Next' on each step.",
        "Once the installation is complete, come back here and click the 'Re-check' button."
    ];

    const dockerSteps = [
        "Click the 'Download Docker' button to get Docker Desktop.",
        "Install the application. This may require a computer restart.",
        "After installation, make sure you start the Docker Desktop application.",
        "Wait for Docker Desktop to show that it is running (usually a green icon in your system tray).",
        "This wizard will automatically detect that Docker is running and the check will pass."
    ];

    const nixSteps = [
        "Click the 'Download Nix' button to go to the official download page.",
        "Follow the instructions for your operating system. For macOS and Linux, this is typically a single command to run in your terminal.",
        "For Windows, you will need to use WSL (Windows Subsystem for Linux) and install Nix within it.",
        "After installation, you may need to restart your terminal or computer. Then, click 'Re-check'."
    ];

    const ahSteps = [
        "Agent Harbor CLI requires Nix to be installed first.",
        "If you don't have Nix, click 'Download' to install it (or use Docker fallback).",
        "Once Nix is installed, open your terminal and run: nix profile install github:blocksense-network/agent-harbor",
        "After installation, click 'Re-check' to verify ah CLI is available."
    ];

    const vscodeSteps = [
        "Click the 'Download VS Code' button to go to the official download page.",
        "Download and run the installer for your operating system.",
        "Ensure the 'Add to PATH' option is selected during installation so this wizard can detect it.",
        "Once installed, come back here and click 'Re-check'."
    ];

    const steps = name === 'Git' ? gitSteps : name === 'Docker' ? dockerSteps : name === 'Nix' ? nixSteps : name === 'Agent Harbor CLI' ? ahSteps : vscodeSteps;

    return (
        <div className="mt-3 text-left">
            <h4 className="font-semibold text-sm text-slate-700 mb-2">Installation Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
                {steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
        </div>
    );
};


const CheckItem: React.FC<{ name: string; status: CheckState; icon: React.ReactNode; installUrl: string; errorDetails?: string | null; isOptional?: boolean; description?: string; errorMessage?: string }> =
    ({ name, status, icon, installUrl, errorDetails, isOptional = false, description, errorMessage }) => {
        const [showInstructions, setShowInstructions] = useState(false);

        const renderStatusIcon = () => {
            switch (status) {
                case CheckState.Pending:
                    return <Spinner className="w-5 h-5 text-slate-300" />;
                case CheckState.Success:
                    return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
                case CheckState.Error:
                    return isOptional
                        ? <InformationCircleIcon className="w-5 h-5 text-blue-300" />
                        : <XCircleIcon className="w-5 h-5 text-red-400" />;
            }
        };

        const isErrorState = status === CheckState.Error;

        return (
            <li className="min-h-[120px] p-3 bg-white rounded-lg border border-slate-200 transition-all flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                        <div className="text-cyan-600 scale-75">{icon}</div>
                        <span className="font-semibold text-slate-800 text-sm">{name}</span>
                    </div>
                    <div>
                        {renderStatusIcon()}
                    </div>
                </div>
                {description && (
                    <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{description}</p>
                )}
                {isErrorState && installUrl !== '#' && (
                    <div className="mt-auto pt-1.5 border-t border-slate-100">
                        <p className={`text-xs mb-1 font-medium ${isOptional ? 'text-blue-600' : 'text-red-500'}`}>
                            {errorMessage || (isOptional
                                ? `${name} is recommended for the best experience (e.g., for Copilot), but not required.`
                                : errorDetails || `${name} is not installed or not running.`)}
                        </p>
                        <div className="flex gap-1 items-center flex-wrap">
                            <a href={installUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline">
                                Download
                            </a>
                            <span className="text-slate-300">•</span>
                            <button onClick={() => setShowInstructions(s => !s)} className="text-xs text-slate-500 hover:text-slate-700 px-1">
                                {showInstructions ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {showInstructions && <InstallationGuide name={name} />}
                    </div>
                )}
            </li>
        );
    };

const SystemCheckStep: React.FC<SystemCheckStepProps> = ({ status, setStatus, onComplete, socket }) => {
    const [isChecking, setIsChecking] = useState(false);
    const pollingIntervalRef = useRef<number | null>(null);

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const handleCheck = useCallback(async (isManual = false) => {
        if (isManual) {
            setIsChecking(true);
            stopPolling();
        }

        try {
            const response = await fetch('/api/system-check');
            const results = await response.json();
            setStatus(prevStatus => {
                const newStatus = {
                    os: results.os,
                    git: results.git ? CheckState.Success : CheckState.Error,
                    docker: results.docker ? CheckState.Success : CheckState.Error,
                    vscode: results.vscode ? CheckState.Success : CheckState.Error,
                    nix: results.nix ? CheckState.Success : CheckState.Error,
                    ah: results.ah ? CheckState.Success : CheckState.Error,
                    dockerError: results.dockerError || null,
                };
                if (JSON.stringify(prevStatus) === JSON.stringify(newStatus)) {
                    return prevStatus;
                }
                return newStatus;
            });
        } catch (error) {
            console.error("Failed to fetch system checks", error);
            setStatus({ git: CheckState.Error, docker: CheckState.Error, vscode: CheckState.Error, nix: CheckState.Error, ah: CheckState.Error, dockerError: 'Failed to connect to the backend server.', os: undefined });
        } finally {
            if (isManual) {
                setIsChecking(false);
            }
        }
    }, [setStatus]);

    useEffect(() => {
        handleCheck(true);
        return () => stopPolling();
    }, [handleCheck]);

    useEffect(() => {
        if (status.docker === CheckState.Error && pollingIntervalRef.current === null) {
            pollingIntervalRef.current = window.setInterval(() => handleCheck(false), 5000);
        } else if (status.docker === CheckState.Success) {
            stopPolling();
        }
        return () => stopPolling();
    }, [status.docker, handleCheck]);

    const isWindows = status.os === 'win32';
    const nixOrDockerAvailable = status.nix === CheckState.Success || status.docker === CheckState.Success;
    const allRequiredChecksPass = status.git === CheckState.Success && status.docker === CheckState.Success;
    const hasRequiredError = status.git === CheckState.Error || status.docker === CheckState.Error;

    return (
        <div className="flex flex-col h-full">
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">System Prerequisite Check</h2>
                <p className="text-center text-slate-600 text-sm mt-1">Verifying required tools before we begin the setup.</p>
            </div>

            <div className="flex-grow">
                <ul className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 auto-rows-auto">
                    <CheckItem
                        name="Git"
                        status={status.git}
                        icon={<GitIcon className="w-8 h-8" />}
                        installUrl="https://git-scm.com/install/windows"
                        description="Version control system for managing code history and creating isolated branches for agent tasks."
                    />
                    <CheckItem
                        name="Docker"
                        status={status.docker}
                        icon={<DockerIcon className="w-8 h-8" />}
                        installUrl="https://docs.docker.com/desktop/setup/install/windows-install/"
                        errorDetails={status.dockerError}
                        description="Container platform for running AI agents in isolated, reproducible environments."
                    />
                    {!isWindows && (
                        <CheckItem
                            name="Nix"
                            status={status.nix}
                            icon={<NixIcon className="w-8 h-8" />}
                            installUrl="https://nixos.org/download"
                            isOptional={status.docker === CheckState.Success}
                            description={status.docker === CheckState.Success
                                ? "Optional: Install Nix for native ah CLI. Otherwise, Docker will be used automatically."
                                : "Required for native ah CLI installation. Alternatively, ensure Docker is available."}
                        />
                    )}
                    {isWindows && (
                        <CheckItem
                            name="Nix (via Docker)"
                            status={status.docker === CheckState.Success ? CheckState.Success : CheckState.Error}
                            icon={<NixIcon className="w-8 h-8" />}
                            installUrl="#"
                            description="Nix runs inside Docker containers on Windows, providing ah CLI without separate installation."
                        />
                    )}
                    <CheckItem
                        name="VS Code"
                        status={status.vscode}
                        icon={<VscodeIcon className="w-8 h-8" />}
                        installUrl="https://code.visualstudio.com/download"
                        isOptional={true}
                        description="Code editor recommended for viewing and editing agent-generated code."
                    />
                    {status.ah !== undefined && (
                        <CheckItem
                            name="Agent Harbor CLI"
                            status={status.ah}
                            icon={<AhIcon className="w-8 h-8" />}
                            installUrl="https://nixos.org/download"
                            errorMessage={status.docker === CheckState.Success
                                ? "Required for running tasks. Will be installed automatically via Docker when needed."
                                : "Required for running Agent Harbor tasks. Install Nix first, or ensure Docker is available."}
                            description={status.docker === CheckState.Success
                                ? "Required for running tasks. Will use Docker-based installation if not installed natively."
                                : "Required for running Agent Harbor tasks. Install via Nix or use Docker fallback."}
                        />
                    )}
                </ul>
            </div>

            <div className="flex-shrink-0 pt-6">
                <div className="text-center text-sm mb-4 h-10">
                    {isChecking && <p className="text-slate-600">Running checks...</p>}
                    {!isChecking && allRequiredChecksPass && (
                        <p className="text-green-600 font-medium">All required checks passed. You can proceed to the next step.</p>
                    )}
                    {!isChecking && hasRequiredError && (
                        <div className="space-y-2">
                            {status.docker === CheckState.Error && (
                                <div className="flex items-center justify-center gap-2 text-slate-600">
                                    <Spinner className="w-4 h-4" />
                                    <span>Waiting for Docker... This will update automatically.</span>
                                </div>
                            )}
                            {status.git === CheckState.Error && (
                                <p className="text-red-600 font-medium">Git is missing. Please follow the instructions to install it.</p>
                            )}
                            {status.docker === CheckState.Error && (
                                <p className="text-red-600 font-medium">Docker is required. Please install Docker Desktop.</p>
                            )}
                            {!isWindows && status.nix === CheckState.Error && status.docker === CheckState.Success && (
                                <p className="text-blue-600 font-medium">Nix is recommended but optional. Docker will be used as fallback.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                    {hasRequiredError || (status.vscode === CheckState.Error && !isChecking) ? (
                        <ActionButton onClick={() => handleCheck(true)} variant="secondary">Re-check</ActionButton>
                    ) : null}
                    <ActionButton
                        onClick={onComplete}
                        disabled={!allRequiredChecksPass || isChecking}
                        variant="primary"
                    >
                        Next
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};

export default SystemCheckStep;