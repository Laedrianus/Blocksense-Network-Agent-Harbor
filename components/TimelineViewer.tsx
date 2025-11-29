import React from 'react';
import { ClockIcon, ShareIcon } from '@heroicons/react/24/outline';

interface Snapshot {
    id: string;
    timestamp: number;
    state: {
        type: string;
        content: string;
    };
}

interface Session {
    id: string;
    taskId: string;
    createdAt: number;
    snapshots: Snapshot[];
}

interface TimelineViewerProps {
    session?: Session;
    onFork: (snapshotId: string) => void;
}

const TimelineViewer: React.FC<TimelineViewerProps> = ({ session, onFork }) => {
    if (!session) return <div className="text-slate-500 text-xs text-center p-4">No session data</div>;

    return (
        <div className="h-full flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <div className="p-3 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Timeline
                </h3>
                <span className="text-xs text-slate-500">{session.snapshots.length} events</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {session.snapshots.map((snap, index) => (
                    <div key={snap.id} className="relative pl-6 border-l-2 border-slate-700 hover:border-cyan-500 transition-colors group">
                        <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-600 group-hover:bg-cyan-500 transition-colors" />

                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">
                                    {new Date(snap.timestamp).toLocaleTimeString()}
                                </span>
                                <p className="text-xs text-slate-300 font-mono line-clamp-2">
                                    {snap.state.content}
                                </p>
                            </div>

                            <button
                                onClick={() => onFork(snap.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-cyan-400 hover:bg-slate-800 rounded transition-all"
                                title="Fork from here"
                            >
                                <ShareIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineViewer;
