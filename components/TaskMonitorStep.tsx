import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import TuiTerminal from './TuiTerminal';

interface TaskMonitorStepProps {
    socket: Socket;
    onBack: () => void;
    onComplete: () => void;
    initialTaskId?: string;
}

interface LogEntry {
    id: number;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

const TaskMonitorStep: React.FC<TaskMonitorStepProps> = ({ socket, onBack, onComplete, initialTaskId }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [status, setStatus] = useState<string>('starting');
    const [taskId, setTaskId] = useState<string | null>(initialTaskId || null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    useEffect(() => {
        const logListener = (log: LogEntry & { taskId?: string }) => {
            if (!taskId || log.taskId === taskId) {
                setLogs(prev => [...prev, log]);
            }
        };

        const statusListener = (data: { taskId: string, status: string }) => {
            if (!taskId || data.taskId === taskId) {
                setStatus(data.status);
            }
        };

        const taskStartedListener = (data: { taskId: string }) => {
            if (!taskId) {
                setTaskId(data.taskId);
            }
        };

        socket.on('task:log', logListener);
        socket.on('task:status', statusListener);
        socket.on('task:started', taskStartedListener);

        return () => {
            socket.off('task:log', logListener);
            socket.off('task:status', statusListener);
            socket.off('task:started', taskStartedListener);
        };
    }, [socket, taskId]);

    const handleCancel = () => {
        if (taskId) {
            socket.emit('task:cancel', taskId);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">Task Monitor</h2>
                    <p className="text-sm text-slate-400">
                        Status: <span className={`font-mono ${status === 'running' ? 'text-green-400' : status === 'failed' ? 'text-red-400' : 'text-slate-300'}`}>{status.toUpperCase()}</span>
                        {taskId && <span className="ml-2 text-xs text-slate-500">ID: {taskId.substring(0, 8)}</span>}
                    </p>
                </div>
                {status === 'running' && (
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-500 transition-colors"
                    >
                        Cancel Task
                    </button>
                )}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                {/* Logs Panel */}
                <div className="bg-slate-900 rounded-lg border border-slate-700 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Activity Log
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
                        {logs.length === 0 && (
                            <div className="text-slate-500 italic text-center mt-4">Waiting for logs...</div>
                        )}
                        {logs.map((log) => (
                            <div key={log.id} className="flex gap-2">
                                <span className="text-slate-500 flex-shrink-0">[{log.timestamp}]</span>
                                <span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-green-400' : 'text-slate-300'}`}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>

                {/* Terminal Panel */}
                <div className="bg-black rounded-lg border border-slate-700 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Terminal Output
                    </div>
                    <div className="flex-1 relative min-h-[300px]">
                        {taskId ? (
                            <TuiTerminal socket={socket} taskId={taskId} />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                Initializing terminal...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-700">
                <button
                    onClick={onBack}
                    className="px-6 py-2 text-sm font-semibold text-slate-200 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors"
                >
                    Back
                </button>
                {(status === 'completed' || status === 'failed' || status === 'cancelled') && (
                    <button
                        onClick={onComplete}
                        className="px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
                    >
                        Finish
                    </button>
                )}
            </div>
        </div>
    );
};

export default TaskMonitorStep;
