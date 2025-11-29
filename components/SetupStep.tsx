import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { LogEntry } from '../types';
import LogViewer from './LogViewer';
import Spinner from './Spinner';

interface SetupStepProps {
    onComplete: () => void;
    onBack: () => void;
    socket: Socket;
}

interface SetupProgress {
    stage: string;
    percentage: number;
    details: string;
}

const SetupStep: React.FC<SetupStepProps> = ({ onComplete, onBack, socket }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [progress, setProgress] = useState<SetupProgress>({ stage: '', percentage: 0, details: '' });
    const [repoExists, setRepoExists] = useState<boolean | null>(null);

    useEffect(() => {
        socket.emit('setup:check_repo_status');

        const repoStatusListener = (data: { repoExists: boolean }) => {
            setRepoExists(data.repoExists);
            // If repo already exists, skip setup and mark as complete
            if (data.repoExists) {
                setIsComplete(true);
                setLogs([{
                    id: Date.now(),
                    timestamp: new Date().toLocaleTimeString(),
                    message: 'Agent Harbor repository already exists. Skipping setup.',
                    type: 'info'
                }]);
            }
        };
        socket.on('setup:repo_status', repoStatusListener);

        const logListener = (log: LogEntry) => {
            setLogs(prev => [...prev, log]);
        };
        const completeListener = () => {
            const message = repoExists
                ? 'Update complete! Environment is up-to-date.'
                : 'Setup complete! Environment is ready.';
            setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message, type: 'success' }]);
            setIsSettingUp(false);
            setIsComplete(true);
        };
        const errorListener = (errorMsg: string) => {
            setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: errorMsg, type: 'error' }]);
            setIsSettingUp(false);
        };
        const progressListener = (data: SetupProgress) => {
            setProgress(data);
        };

        socket.on('setup:log', logListener);
        socket.on('setup:complete', completeListener);
        socket.on('setup:error', errorListener);
        socket.on('setup:progress', progressListener);

        return () => {
            socket.off('setup:repo_status', repoStatusListener);
            socket.off('setup:log', logListener);
            socket.off('setup:complete', completeListener);
            socket.off('setup:error', errorListener);
            socket.off('setup:progress', progressListener);
        };
    }, [socket, repoExists]);

    const handleSetup = () => {
        setIsSettingUp(true);
        setIsComplete(false);
        setLogs([]);
        setProgress({ stage: 'Starting...', percentage: 0, details: '' });
        socket.emit('setup:start');
    };

    if (repoExists === null) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner className="w-8 h-8 text-cyan-500" />
                <p className="ml-4 text-slate-400">Checking setup status...</p>
            </div>
        );
    }

    const title = repoExists ? "Update Agent Harbor" : "Agent Harbor Setup";
    const description = repoExists
        ? "An existing Agent Harbor setup was found. This step will check for the latest updates from the repository."
        : "This step will clone the Agent Harbor repository and prepare the development environment.";

    let buttonLabel = repoExists ? "Skip (Already Installed)" : "Start Setup";
    if (isSettingUp) {
        buttonLabel = repoExists ? "Updating..." : "Setting up...";
    } else if (isComplete) {
        buttonLabel = repoExists ? "Update Complete" : "Setup Complete";
    }

    return (
        <div>
            <h2 className="text-xl font-bold text-center text-slate-800">{title}</h2>
            <p className="text-center text-slate-600 text-sm mt-1 mb-6">{description}</p>

            <div className="text-center flex flex-col items-center gap-3">
                {repoExists ? (
                    <>
                        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Agent Harbor is installed and ready.</span>
                        </div>
                        <p className="text-slate-500 text-xs mb-4">You can proceed to the next step or check for updates if needed.</p>

                        <button
                            onClick={handleSetup}
                            disabled={isSettingUp || isComplete}
                            className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                            {isSettingUp ? "Checking for updates..." : "Check for updates"}
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleSetup}
                        disabled={isSettingUp || isComplete}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition-colors"
                    >
                        {isSettingUp ? <Spinner className="w-5 h-5 mr-2" /> : null}
                        {buttonLabel}
                    </button>
                )}
            </div>

            {isSettingUp && (
                <div className="mt-6 max-w-xl mx-auto">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-semibold text-slate-600 capitalize">{progress.stage} ({progress.percentage}%)</span>
                        <span className="text-xs text-slate-500 truncate">{progress.details}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div
                            className="bg-cyan-600 h-2.5 rounded-full transition-all duration-200"
                            style={{ width: `${progress.percentage}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <LogViewer logs={logs} title="Setup Logs" />

            {isComplete && (
                <p className="text-green-600 text-sm mt-6 text-center">Process completed successfully.</p>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center">
                <button
                    onClick={onBack}
                    disabled={isSettingUp}
                    className="px-6 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg shadow-sm hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onComplete}
                    disabled={(!isComplete && !repoExists) || isSettingUp}
                    className="px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default SetupStep;