import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import TaskMonitorStep from './TaskMonitorStep';
import TimelineViewer from './TimelineViewer';
import { PlusIcon, QueueListIcon, ArrowDownTrayIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TaskDashboardStepProps {
    socket: Socket;
    onBack: () => void;
    onComplete: () => void;
    initialTaskId?: string;
    onCreateNewTask: () => void;
}

interface TaskSummary {
    id: string;
    status: 'starting' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
    startTime: number;
}

const TaskDashboardStep: React.FC<TaskDashboardStepProps> = ({ socket, onBack, onComplete, initialTaskId, onCreateNewTask }) => {
    const [tasks, setTasks] = useState<TaskSummary[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId || null);
    const [showTimeline, setShowTimeline] = useState(false);
    const [currentSession, setCurrentSession] = useState<any>(null); // Should type properly

    useEffect(() => {
        if (initialTaskId && !tasks.find(t => t.id === initialTaskId)) {
            setTasks(prev => [...prev, { id: initialTaskId, status: 'starting', startTime: Date.now() }]);
        }
    }, [initialTaskId]);

    useEffect(() => {
        const statusListener = (data: { taskId: string, status: any }) => {
            setTasks(prev => {
                const existing = prev.find(t => t.id === data.taskId);
                if (existing) {
                    return prev.map(t => t.id === data.taskId ? { ...t, status: data.status } : t);
                } else {
                    return [...prev, { id: data.taskId, status: data.status, startTime: Date.now() }];
                }
            });
        };

        const taskStartedListener = (data: { taskId: string }) => {
            setTasks(prev => {
                if (prev.find(t => t.id === data.taskId)) return prev;
                return [...prev, { id: data.taskId, status: 'running', startTime: Date.now() }];
            });
            // Auto-select new task if none selected or if it's the first one
            if (!selectedTaskId) {
                setSelectedTaskId(data.taskId);
            }
        };

        socket.on('task:status', statusListener);
        socket.on('task:started', taskStartedListener);

        return () => {
            socket.off('task:status', statusListener);
            socket.off('task:started', taskStartedListener);
        };
    }, [socket, selectedTaskId]);

    useEffect(() => {
        const transcriptListener = (data: { sessionId: string, transcript: string }) => {
            const blob = new Blob([data.transcript], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transcript-${data.sessionId}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        socket.on('session:transcript', transcriptListener);
        return () => {
            socket.off('session:transcript', transcriptListener);
        };
    }, [socket]);

    const handleFork = (snapshotId: string) => {
        console.log('Forking from snapshot:', snapshotId);
        // socket.emit('session:fork', ...);
    };

    const handleDownloadTranscript = () => {
        if (currentSession) {
            socket.emit('session:export', currentSession.id);
        } else {
            // Fallback: try to find session by task ID (not implemented in this mock UI yet)
            // But we can emit with task ID and let server handle lookup if we changed the event
            // For now, let's assume we have the session
            // If we don't have session object, we can't export easily without fetching it first
            // For now, just warn
            console.warn("No active session to export");
            // In a real app, we would fetch session details when task is selected
            // For now, let's just emit with a dummy ID or try to use selectedTaskId to fetch session first
            if (selectedTaskId) {
                // We could emit a 'session:get' event here
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'bg-green-500';
            case 'paused': return 'bg-yellow-500';
            case 'completed': return 'bg-blue-500';
            case 'failed': return 'bg-red-500';
            case 'cancelled': return 'bg-slate-500';
            default: return 'bg-slate-300';
        }
    };

    return (
        <div className="flex h-full gap-4">
            {/* Sidebar - Task List */}
            <div className="w-64 flex-shrink-0 flex flex-col bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <QueueListIcon className="w-4 h-4" />
                        Tasks
                    </h3>
                    <button
                        onClick={onCreateNewTask}
                        className="p-1 hover:bg-slate-700 rounded text-cyan-400 transition-colors"
                        title="New Task"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {tasks.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed m-2">
                            <div className="text-center p-4">
                                <QueueListIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs mb-3">No active tasks</p>
                                <button
                                    onClick={onCreateNewTask}
                                    className="px-3 py-1.5 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-colors"
                                >
                                    Create Task
                                </button>
                            </div>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <button
                                key={task.id}
                                onClick={() => setSelectedTaskId(task.id)}
                                className={`w-full text-left p-3 rounded-md border transition-all ${selectedTaskId === task.id
                                    ? 'bg-slate-700 border-cyan-500 ring-1 ring-cyan-500/50'
                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-mono text-slate-300 truncate w-20" title={task.id}>
                                        {task.id.substring(0, 8)}...
                                    </span>
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                                </div>
                                <div className="text-xs text-slate-400 capitalize">
                                    {task.status}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content - Task Monitor */}
            <div className="flex-1 flex flex-col min-w-0 gap-4">
                {selectedTaskId ? (
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowTimeline(!showTimeline)}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${showTimeline ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                                title="Toggle Timeline"
                            >
                                <ClockIcon className="w-4 h-4" />
                                History
                            </button>
                            <button
                                onClick={handleDownloadTranscript}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 text-slate-200 rounded hover:bg-slate-600 transition-colors"
                                title="Download Transcript"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Export Log
                            </button>
                        </div>
                        <div className="flex-1 flex gap-4 min-h-0">
                            <div className="flex-1 min-h-0">
                                <TaskMonitorStep
                                    key={selectedTaskId}
                                    socket={socket}
                                    onBack={onBack}
                                    onComplete={onComplete}
                                    initialTaskId={selectedTaskId}
                                />
                            </div>
                            {showTimeline && (
                                <div className="w-80 flex-shrink-0 border-l border-slate-700 pl-4">
                                    <TimelineViewer session={currentSession} onFork={handleFork} />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
                        <div className="text-center">
                            <QueueListIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Select a task to monitor</p>
                            <button
                                onClick={onCreateNewTask}
                                className="mt-4 px-4 py-2 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-colors"
                            >
                                Create New Task
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDashboardStep;
