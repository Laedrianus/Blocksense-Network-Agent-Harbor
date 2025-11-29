import { useState, useEffect } from 'react';
import { Task, LogEntry } from '../types';
import { Socket } from 'socket.io-client';

interface ParallelTasksStepProps {
    socket: Socket;
    onBack: () => void;
    onNext: () => void;
    selectedAgent: string;
}

const MAX_PARALLEL_TASKS = 10;

export default function ParallelTasksStep({ socket, onBack, onNext, selectedAgent }: ParallelTasksStepProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTasks, setNewTasks] = useState<Array<{ branch: string; description: string }>>([
        { branch: '', description: '' }
    ]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [taskLogs, setTaskLogs] = useState<Map<string, LogEntry[]>>(new Map());

    useEffect(() => {
        // Load existing tasks
        socket.emit('parallel:list');

        // Setup event listeners
        const tasksListener = ({ tasks: taskList }: { tasks: Task[] }) => {
            setTasks(taskList);
        };

        const taskCreatedListener = ({ task }: { task: Task }) => {
            setTasks(prev => [...prev, task]);
        };

        const taskStatusListener = ({ taskId, status }: { taskId: string; status: Task['status'] }) => {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
        };

        const taskLogListener = ({ taskId, log }: { taskId: string; log: LogEntry }) => {
            setTaskLogs(prev => {
                const newMap = new Map(prev);
                const logs = newMap.get(taskId) || [];
                newMap.set(taskId, [...logs, log]);
                return newMap;
            });
        };

        const errorListener = ({ message }: { message: string }) => {
            setError(message);
            setCreating(false);
        };

        socket.on('parallel:tasks', tasksListener);
        socket.on('parallel:task:created', taskCreatedListener);
        socket.on('parallel:task:status', taskStatusListener);
        socket.on('parallel:task:log', taskLogListener);
        socket.on('parallel:error', errorListener);

        return () => {
            socket.off('parallel:tasks', tasksListener);
            socket.off('parallel:task:created', taskCreatedListener);
            socket.off('parallel:task:status', taskStatusListener);
            socket.off('parallel:task:log', taskLogListener);
            socket.off('parallel:error', errorListener);
        };
    }, [socket]);

    const addNewTask = () => {
        if (newTasks.length >= MAX_PARALLEL_TASKS) {
            setError(`Maximum ${MAX_PARALLEL_TASKS} tasks allowed`);
            return;
        }
        setNewTasks([...newTasks, { branch: '', description: '' }]);
    };

    const removeTask = (index: number) => {
        setNewTasks(newTasks.filter((_, i) => i !== index));
    };

    const updateTask = (index: number, field: 'branch' | 'description', value: string) => {
        const updated = [...newTasks];
        updated[index][field] = value;
        setNewTasks(updated);
    };

    const createTasks = () => {
        const validTasks = newTasks.filter(t => t.branch && t.description);
        if (validTasks.length === 0) {
            setError('Please fill in at least one task');
            return;
        }

        const runningCount = tasks.filter(t => t.status === 'running').length;
        if (runningCount + validTasks.length > MAX_PARALLEL_TASKS) {
            setError(`Cannot exceed ${MAX_PARALLEL_TASKS} concurrent tasks (${runningCount} currently running)`);
            return;
        }

        setCreating(true);
        setError(null);

        socket.emit('parallel:create:batch', {
            tasks: validTasks.map(t => ({
                agent: selectedAgent,
                branchName: t.branch,
                description: t.description
            }))
        });

        // Clear form after submission
        setNewTasks([{ branch: '', description: '' }]);
        setCreating(false);
    };

    const cancelTask = (taskId: string) => {
        socket.emit('task:cancel', taskId);
    };

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-300';
            case 'running': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'failed': return 'bg-red-100 text-red-700 border-red-300';
            case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-300';
            default: return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    const stats = {
        total: tasks.length,
        running: tasks.filter(t => t.status === 'running').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length
    };

    return (
        <div className="h-full flex flex-col">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Parallel Tasks</h2>
                <p className="text-slate-600 text-sm mt-1">
                    Create and monitor up to {MAX_PARALLEL_TASKS} tasks simultaneously
                </p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                    <button onClick={() => setError(null)} className="text-xs text-red-600 underline mt-1">
                        Dismiss
                    </button>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                    <div className="text-xs text-slate-600 uppercase tracking-wider mt-1">Total</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{stats.running}</div>
                    <div className="text-xs text-blue-600 uppercase tracking-wider mt-1">Running</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                    <div className="text-xs text-green-600 uppercase tracking-wider mt-1">Completed</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
                    <div className="text-xs text-red-600 uppercase tracking-wider mt-1">Failed</div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Task Creation */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Create Tasks</h3>
                        <button
                            onClick={addNewTask}
                            disabled={newTasks.length >= MAX_PARALLEL_TASKS}
                            className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50"
                        >
                            + Add Task
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {newTasks.map((task, index) => (
                            <div key={index} className="p-4 border border-slate-200 rounded-lg bg-white">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-sm font-semibold text-slate-700">Task #{index + 1}</span>
                                    {newTasks.length > 1 && (
                                        <button
                                            onClick={() => removeTask(index)}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={task.branch}
                                        onChange={(e) => updateTask(index, 'branch', e.target.value)}
                                        placeholder="Branch name (e.g., feature/task-1)"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                    <textarea
                                        value={task.description}
                                        onChange={(e) => updateTask(index, 'description', e.target.value)}
                                        placeholder="Task description"
                                        rows={2}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={createTasks}
                            disabled={creating}
                            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 font-medium"
                        >
                            {creating ? 'Creating...' : `Create ${newTasks.filter(t => t.branch && t.description).length} Task(s)`}
                        </button>
                    </div>
                </div>

                {/* Task List/Grid */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Active Tasks ({tasks.length})</h3>
                        <button
                            onClick={() => socket.emit('parallel:list')}
                            className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {tasks.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p>No tasks created yet</p>
                                <p className="text-sm mt-1">Create tasks to see them here</p>
                            </div>
                        ) : (
                            tasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedTaskId === task.id
                                        ? 'border-cyan-500 bg-cyan-50'
                                        : 'border-slate-200 bg-white hover:border-cyan-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-slate-800">{task.branch}</h4>
                                            <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </div>

                                    {task.status === 'running' && (
                                        <div className="mt-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    cancelTask(task.id);
                                                }}
                                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}

                                    {/* Task Logs (collapsed) */}
                                    {selectedTaskId === task.id && taskLogs.has(task.id) && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <h5 className="text-xs font-semibold text-slate-700 mb-2">Recent Logs:</h5>
                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                {(taskLogs.get(task.id) || []).slice(-5).map((log, idx) => (
                                                    <div key={idx} className="text-xs">
                                                        <span className="text-slate-500">{log.timestamp}</span>
                                                        <span className={`ml-2 ${log.type === 'error' ? 'text-red-600' :
                                                            log.type === 'success' ? 'text-green-600' :
                                                                log.type === 'warning' ? 'text-orange-600' :
                                                                    'text-slate-700'
                                                            }`}>
                                                            {log.message}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
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
