import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface LogViewerProps {
    logs: LogEntry[];
    title: string;
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, title }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const getLogColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'success':
                return 'text-green-700';
            case 'error':
                return 'text-red-700';
            case 'warning':
                return 'text-orange-700';
            case 'info':
            default:
                return 'text-slate-800';
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
            <div
                ref={logContainerRef}
                className="w-full h-40 bg-white rounded-lg p-3 font-mono text-xs border border-slate-300 overflow-y-auto"
            >
                {logs.length === 0 && <p className="text-slate-500 text-xs">Awaiting output...</p>}
                {logs.map((log, index) => (
                    <div key={`${log.id}-${index}`} className="flex gap-2">
                        <span className="text-slate-600">{log.timestamp}</span>
                        <span className={`${getLogColor(log.type)} flex-1`}>{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LogViewer;