import { useState, useEffect } from 'react';
import { Task, Timeline as TimelineType } from '../types';
import { Socket } from 'socket.io-client';
import Spinner from './Spinner';

interface TimelineStepProps {
    socket: Socket;
    onBack: () => void;
    onNext: () => void;
}

export default function TimelineStep({ socket, onBack, onNext }: TimelineStepProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [timeline, setTimeline] = useState<TimelineType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forkDialogOpen, setForkDialogOpen] = useState(false);
    const [forkBranch, setForkBranch] = useState('');
    const [forkPrompt, setForkPrompt] = useState('');

    useEffect(() => {
        // Load tasks on mount
        loadTasks();

        // Setup event listeners
        const tasksListener = ({ tasks: taskList }: { tasks: Task[] }) => {
            setTasks(taskList);
            setLoading(false);
        };

        const timelineListener = ({ timeline: tl }: { timeline: TimelineType }) => {
            setTimeline(tl);
            setLoading(false);
        };

        const errorListener = ({ message }: { message: string }) => {
            setError(message);
            setLoading(false);
        };

        const forkedListener = () => {
            setForkDialogOpen(false);
            setForkBranch('');
            setForkPrompt('');
            loadTasks(); // Reload tasks to show new fork
        };

        socket.on('timeline:tasks', tasksListener);
        socket.on('timeline:data', timelineListener);
        socket.on('timeline:error', errorListener);
        socket.on('timeline:forked', forkedListener);

        return () => {
            socket.off('timeline:tasks', tasksListener);
            socket.off('timeline:data', timelineListener);
            socket.off('timeline:error', errorListener);
            socket.off('timeline:forked', forkedListener);
        };
    }, [socket]);

    const loadTasks = () => {
        setLoading(true);
        setError(null);
        socket.emit('timeline:list');
    };

    const loadTimeline = (task: Task) => {
        setSelectedTask(task);
        setLoading(true);
        setError(null);
        socket.emit('timeline:get', { taskId: task.id });
    };

    const handleRewind = (snapshotId: string) => {
        if (!selectedTask) return;
        setLoading(true);
        socket.emit('timeline:rewind', { taskId: selectedTask.id, snapshotId });
    };

    const handleFork = () => {
        if (!selectedTask || !forkBranch || !forkPrompt) {
            setError('Branch name and prompt are required for forking');
            return;
        }
        setLoading(true);
        socket.emit('timeline:fork', {
            taskId: selectedTask.id,
            newBranch: forkBranch,
            prompt: forkPrompt
        });
    };

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50';
            case 'running': return 'text-blue-600 bg-blue-50';
            case 'failed': return 'text-red-600 bg-red-50';
            case 'cancelled': return 'text-gray-600 bg-gray-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Task Timeline</h2>
                <p className="text-slate-600 text-sm mt-1">
                    View task history, rewind to snapshots, and fork tasks
                </p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-xs text-red-600 underline mt-1"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Task List */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">All Tasks</h3>
                        <button
                            onClick={loadTasks}
                            disabled={loading}
                            className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {loading && tasks.length === 0 ? (
                            <div className="flex items-center justify-center h-32">
                                <Spinner className="w-8 h-8 text-cyan-600" />
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p>No tasks found</p>
                                <p className="text-sm mt-1">Create a task to see it here</p>
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => loadTimeline(task)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedTask?.id === task.id
                                        ? 'border-cyan-500 bg-cyan-50'
                                        : 'border-slate-200 bg-white hover:border-cyan-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-slate-800">{task.branch}</h4>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span>Agent: {task.agent}</span>
                                        <span>{formatDate(task.createdAt)}</span>
                                    </div>
                                    {task.parentTaskId && (
                                        <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                            Forked from: {task.parentTaskId}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Timeline Details */}
                <div className="flex flex-col border-l border-slate-200 pl-6">
                    {!selectedTask ? (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <div className="text-center">
                                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-medium">Select a task</p>
                                <p className="text-sm mt-1">to view its timeline</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                    Timeline: {selectedTask.branch}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setForkDialogOpen(true)}
                                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-500"
                                    >
                                        Fork Task
                                    </button>
                                </div>
                            </div>

                            {/* Fork Dialog */}
                            {forkDialogOpen && (
                                <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <h4 className="font-semibold text-purple-900 mb-3">Fork Task</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                New Branch Name
                                            </label>
                                            <input
                                                type="text"
                                                value={forkBranch}
                                                onChange={(e) => setForkBranch(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                placeholder="feature/alternative-approach"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                New Instructions
                                            </label>
                                            <textarea
                                                value={forkPrompt}
                                                onChange={(e) => setForkPrompt(e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                placeholder="Try a different approach..."
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleFork}
                                                disabled={loading || !forkBranch || !forkPrompt}
                                                className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 text-sm"
                                            >
                                                Create Fork
                                            </button>
                                            <button
                                                onClick={() => setForkDialogOpen(false)}
                                                className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Snapshots */}
                            <div className="flex-1 overflow-y-auto">
                                {loading && !timeline ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Spinner className="w-8 h-8 text-cyan-600" />
                                    </div>
                                ) : timeline && timeline.snapshots.length > 0 ? (
                                    <div className="space-y-2">
                                        {timeline.snapshots.map((snapshot, index) => (
                                            <div
                                                key={snapshot.id}
                                                className="p-3 border border-slate-200 rounded-lg bg-white hover:border-cyan-300 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-mono text-slate-500">
                                                                #{index + 1}
                                                            </span>
                                                            <span className="text-sm font-medium text-slate-800">
                                                                {snapshot.message}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500">
                                                            {formatDate(snapshot.timestamp)}
                                                        </p>
                                                        {snapshot.filesChanged !== undefined && (
                                                            <p className="text-xs text-slate-600 mt-1">
                                                                Files changed: {snapshot.filesChanged}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRewind(snapshot.id)}
                                                        disabled={loading}
                                                        className="px-2 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-500 disabled:opacity-50"
                                                    >
                                                        Rewind
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <p>No snapshots available</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-slate-200 mt-auto">
                <button
                    onClick={onBack}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 font-medium"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
