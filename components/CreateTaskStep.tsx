import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { TaskDetails, LogEntry } from '../types';
import LogViewer from './LogViewer';
import Spinner from './Spinner';

interface CreateTaskStepProps {
    details: TaskDetails;
    setDetails: React.Dispatch<React.SetStateAction<TaskDetails>>;
    onComplete: () => void;
    onBack: () => void;
    socket: Socket;
    selectedAgent: string;
    setLastTaskFile?: (f: { filename: string; content: string } | null) => void;
}

const CreateTaskStep: React.FC<CreateTaskStepProps> = ({ details, setDetails, onComplete, onBack, socket, selectedAgent, setLastTaskFile }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [ghAuth, setGhAuth] = useState<{ authenticated: boolean; message: string }>({ authenticated: false, message: 'Unknown' });

    useEffect(() => {
        const logListener = (log: LogEntry) => {
            setLogs(prev => [...prev, log]);
        };
        const completeListener = () => {
            setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: 'Task workflow finished successfully.', type: 'success' }]);
            setIsRunning(false);
            setIsComplete(true);
        };
        const errorListener = (errorMsg: string) => {
            setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: errorMsg, type: 'error' }]);
            setIsRunning(false);
        }

        socket.on('task:log', logListener);
        socket.on('task:complete', completeListener);
        socket.on('task:error', errorListener);

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
            socket.off('task:complete', completeListener);
            socket.off('task:error', errorListener);
            socket.off('auth:github:status', authStatusListener);
            socket.off('auth:log', authLogListener);
            socket.off('auth:error', authErrorListener);
            socket.off('auth:complete', authCompleteListener);
            socket.off('task:file_raw', fileRawListener);
        };
    }, [socket, details.branchName, setLastTaskFile]);

    const handleRunTask = (e: React.FormEvent) => {
        e.preventDefault();
        setIsRunning(true);
        setIsComplete(false);
        setLogs([]);
        socket.emit('task:create', { ...details, agent: selectedAgent });
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-center text-slate-100">Create a New Task</h2>
            <p className="text-center text-slate-400 text-sm mt-1 mb-6">Define a task for the AI agent to perform. This will create a new git branch and start the workflow.</p>

            <form onSubmit={handleRunTask} className="max-w-xl mx-auto space-y-4">
                <div className="rounded-lg border border-slate-600 bg-slate-900 p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-300 font-medium">GitHub Push</p>
                            <p className="text-xs text-slate-400">Status: {ghAuth.authenticated ? 'Authenticated' : 'Not authenticated'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => socket.emit('auth:github:status')} className="px-3 py-1.5 text-xs bg-slate-700 text-slate-100 rounded hover:bg-slate-600">Check</button>
                            <button type="button" onClick={() => socket.emit('auth:github:login')} className="px-3 py-1.5 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-500">Sign in</button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">If unchecked, changes are committed locally only.</p>
                </div>
                <div>
                    <label htmlFor="branch-name" className="block text-sm font-medium text-slate-300 mb-2">
                        Branch Name
                    </label>
                    <input
                        type="text"
                        id="branch-name"
                        value={details.branchName}
                        onChange={(e) => setDetails(prev => ({ ...prev, branchName: e.target.value }))}
                        className="w-full bg-slate-900 text-slate-200 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="feature/add-login-button"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="task-description" className="block text-sm font-medium text-slate-300 mb-2">
                        Task Description
                    </label>
                    <textarea
                        id="task-description"
                        rows={3}
                        value={details.description}
                        onChange={(e) => setDetails(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-900 text-slate-200 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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
                        className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-800"
                    />
                    <label htmlFor="push-remote" className="ml-2 block text-sm text-slate-300">
                        Automatically push changes to remote on completion
                    </label>
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
                    className="px-6 py-2 text-sm font-semibold text-slate-200 bg-slate-600 rounded-lg shadow-sm hover:bg-slate-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
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