import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { TaskDetails, LogEntry } from '../types';
import LogViewer from './LogViewer';
import Spinner from './Spinner';

interface CreateTaskStepProps {
    details: TaskDetails;
    setDetails: (details: TaskDetails) => void;
    onComplete: (taskId?: string) => void;
    onBack: () => void;
    socket: Socket;
    selectedAgent: string;
    setLastTaskFile?: (f: { filename: string; content: string } | null) => void;
}

const CreateTaskStep: React.FC<CreateTaskStepProps> = ({ details, setDetails, onComplete, onBack, socket, selectedAgent, setLastTaskFile }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isCreating, setIsCreating] = useState(false); // New state for task creation
    const [ghAuth, setGhAuth] = useState<{ authenticated: boolean; message: string }>({ authenticated: false, message: 'Unknown' });

    useEffect(() => {
        const logListener = (log: LogEntry) => {
            setLogs(prev => [...prev, log]);
        };
        // Removed completeListener as onComplete is now called on task:started
        const errorListener = (errorMsg: string) => {
            setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: errorMsg, type: 'error' }]);
            setIsRunning(false);
            setIsCreating(false); // Stop creating on error
        }

        const taskStartedListener = (data: { taskId: string }) => {
            setIsCreating(false);
            onComplete(data.taskId);
        };

        socket.on('task:log', logListener);
        // socket.on('task:complete', completeListener); // Removed
        socket.on('task:error', errorListener);
        socket.on('task:started', taskStartedListener); // New listener

        const authStatusListener = (payload: { authenticated: boolean; message: string }) => {
            setGhAuth(payload);
        };
        const authLogListener = (log: LogEntry) => {
            setLogs(prev => [...prev, { ...log, message: `[GitHub Auth] ${log.message}` }]);
        };
        const authErrorListener = (msg: string) => {
            setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: `[GitHub Auth] ${msg}`, type: 'error' }]);
        };
        const authCompleteListener = () => {
            setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: '[GitHub Auth] Login complete.', type: 'success' }]);
        };

        socket.on('auth:github:status', authStatusListener);
        socket.on('auth:log', authLogListener);
        socket.on('auth:error', authErrorListener);
        socket.on('auth:complete', authCompleteListener);

        // capture task file content for download in Summary
        const fileRawListener = (log: any) => {
            const msg = typeof log === 'string' ? log : (log?.message || '');
            if (setLastTaskFile && details.branchName) {
                setLastTaskFile({ filename: `.agents/tasks/${details.branchName}.md`, content: msg });
            }
        };
        socket.on('task:file_raw', fileRawListener);

        return () => {
            socket.off('task:log', logListener);
            // socket.off('task:complete', completeListener); // Removed
            socket.off('task:error', errorListener);
            socket.off('task:started', taskStartedListener); // New cleanup
            socket.off('auth:github:status', authStatusListener);
            socket.off('auth:log', authLogListener);
            socket.off('auth:error', authErrorListener);
            socket.off('auth:complete', authCompleteListener);
            socket.off('task:file_raw', fileRawListener);
        };
    }, [socket, details.branchName, setLastTaskFile, onComplete]); // Added onComplete to dependencies

    const exampleTasks = [
        {
            branchName: 'feature/add-login-button',
            description: 'Add a stylish login button to the navigation bar with proper authentication flow and user feedback',
        },
        {
            branchName: 'fix/api-timeout-error',
            description: 'Fix the API timeout error occurring on slow network connections by implementing retry logic and better error handling',
        },
        {
            branchName: 'refactor/database-queries',
            description: 'Optimize database queries in the user module to improve performance and reduce response time',
        },
    ];

    const handleExampleClick = (example: typeof exampleTasks[0]) => {
        setDetails({
            ...details,
            branchName: example.branchName,
            description: example.description,
        });
    };

    const handleRunTask = (e: React.FormEvent) => {
        e.preventDefault();
        setIsRunning(true);
        setIsComplete(false);
        setLogs([]);
        socket.emit('task:create', { ...details, agent: selectedAgent });
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-center text-slate-800">Create a New Task</h2>
            <p className="text-center text-slate-600 text-sm mt-1 mb-6">Define a task for the AI agent to perform. This will create a new git branch and start the workflow.</p>

            {/* Example Tasks Section */}
            <div className="max-w-xl mx-auto mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-slate-700">Quick Start Examples</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {exampleTasks.map((example, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleExampleClick(example)}
                            className="text-left p-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 hover:border-blue-200 transition-colors group"
                        >
                            <div className="flex items-start gap-2">
                                <span className="text-xs font-mono text-blue-600 mt-0.5">#{index + 1}</span>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-blue-900 group-hover:text-blue-700">{example.branchName}</p>
                                    <p className="text-xs text-blue-700 mt-0.5">{example.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Click an example to populate the form below</p>
            </div>

            <form onSubmit={handleRunTask} className="max-w-xl mx-auto space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-700 font-medium">GitHub Push</p>
                            <p className="text-xs text-slate-500">Status: {ghAuth.authenticated ? 'Authenticated' : 'Not authenticated'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => socket.emit('auth:github:status')} className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300">Check</button>
                            <button type="button" onClick={() => socket.emit('auth:github:login')} className="px-3 py-1.5 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-500">Sign in</button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">If unchecked, changes are committed locally only.</p>
                </div>
                <div>
                    <label htmlFor="branch-name" className="block text-sm font-medium text-slate-700 mb-2">
                        Branch Name
                    </label>
                    <input
                        type="text"
                        id="branch-name"
                        value={details.branchName}
                        onChange={(e) => setDetails(prev => ({ ...prev, branchName: e.target.value }))}
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="feature/add-login-button"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 mb-2">
                        Task Description
                    </label>
                    <textarea
                        id="task-description"
                        rows={3}
                        value={details.description}
                        onChange={(e) => setDetails(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="Implement a new login button on the homepage header"
                        required
                    />
                </div>
                <div className="flex items-center">
                    <input
                        id="push-remote"
                        type="checkbox"
                        checked={details.pushToRemote}
                        onChange={(e) => setDetails(prev => ({ ...prev, pushToRemote: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <label htmlFor="push-remote" className="ml-2 block text-sm text-slate-700">
                        Automatically push changes to remote on completion
                    </label>
                </div>
                <div className="flex items-center">
                    <input
                        id="yolo-mode"
                        type="checkbox"
                        checked={details.yoloMode || false}
                        onChange={(e) => setDetails(prev => ({ ...prev, yoloMode: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="yolo-mode" className="ml-2 block text-sm text-slate-700">
                        <span className="font-bold text-red-400">YOLO Mode</span> (Auto-approve all actions)
                    </label>
                </div>
                <div>
                    <label htmlFor="platform" className="block text-sm font-medium text-slate-700 mb-2">
                        Target Platform
                    </label>
                    <select
                        id="platform"
                        value={details.platform || 'linux'}
                        onChange={(e) => setDetails(prev => ({ ...prev, platform: e.target.value }))}
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                        <option value="linux">Linux (Docker)</option>
                        <option value="windows">Windows (Native)</option>
                        <option value="macos" disabled>macOS (Not supported on this host)</option>
                    </select>
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={isRunning || !details.branchName || !details.description}
                        className="w-full inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition-colors"
                    >
                        {isRunning && <Spinner className="w-5 h-5 mr-2" />}
                        {isRunning ? 'Running Task...' : 'Run Task'}
                    </button>
                </div>
            </form>

            <LogViewer logs={logs} title="Task Execution Logs" />

            {isComplete && (
                <p className="text-green-400 text-sm mt-6 text-center">Task process has been initiated.</p>
            )}

            <div className="mt-6 pt-6 border-t border-slate-600 flex justify-between items-center">
                <button
                    onClick={onBack}
                    disabled={isRunning}
                    className="px-6 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg shadow-sm hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onComplete}
                    disabled={!isComplete || isRunning}
                    className="w-auto inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition-colors"
                >
                    Finish
                </button>
            </div>
        </div>
    );
};

export default CreateTaskStep;