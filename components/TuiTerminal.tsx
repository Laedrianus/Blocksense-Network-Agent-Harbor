import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Socket } from 'socket.io-client';
import 'xterm/css/xterm.css';

interface TuiTerminalProps {
    socket: Socket;
    taskId: string;
}

const TuiTerminal: React.FC<TuiTerminalProps> = ({ socket, taskId }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm.js
        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#0f172a', // slate-900
                foreground: '#cbd5e1', // slate-300
            },
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 12,
            convertEol: true, // Convert \n to \r\n
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        term.writeln('\x1b[36mInitializing terminal connection...\x1b[0m');

        // Handle resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, []);

    useEffect(() => {
        if (!xtermRef.current || !taskId) return;

        const outputListener = (data: { taskId: string, output: string }) => {
            if (data.taskId === taskId) {
                xtermRef.current?.write(data.output);
            }
        };

        socket.on('task:output', outputListener);

        return () => {
            socket.off('task:output', outputListener);
        };
    }, [socket, taskId]);

    return (
        <div className="h-full w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 p-1">
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    );
};

export default TuiTerminal;
