import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, VscodeIcon, ClipboardIcon, ClipboardCheckIcon, JulesLogo } from './IconComponents';

interface SummaryStepProps {
    onReset: () => void;
    onBack: () => void;
    selectedAgent: string;
    lastTaskFile?: { filename: string; content: string } | null;
    branchName?: string;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ onReset, onBack, selectedAgent, lastTaskFile, branchName }) => {
    const isCopilot = selectedAgent === 'copilot';
    const [projectPath, setProjectPath] = useState<string>('Loading project path...');
    const [copied, setCopied] = useState(false);
    const [diffFiles, setDiffFiles] = useState<{ path: string; patch: string }[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        if (isCopilot) {
            fetch('/api/project-path')
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return res.json();
                })
                .then(data => setProjectPath(data.path))
                .catch(() => setProjectPath('Could not retrieve project path.'));
        }
    }, [isCopilot]);

    useEffect(() => {
        if (branchName) {
            fetch(`/api/task-diff?branch=${encodeURIComponent(branchName)}`)
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(data => setDiffFiles(data.files || []))
                .catch(() => setDiffFiles([]));
        }
    }, [branchName]);

    const handleCopy = () => {
        if (navigator.clipboard && projectPath) {
            navigator.clipboard.writeText(projectPath).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const formatPathForVscodeUri = (path: string): string => {
        if (!path || path.startsWith('Loading')) {
            return '#';
        }
        // Replace all backslashes with forward slashes
        let uriPath = path.replace(/\\/g, '/');
        
        // For Windows paths like "C:/Users/Test", prepend a slash to make it "/C:/Users/Test"
        if (/^[a-zA-Z]:/.test(uriPath)) {
            uriPath = `/${uriPath}`;
        }
        
        return `vscode://file${uriPath}`;
    };

    if (selectedAgent === 'jules') {
        return (
            <div className="text-center">
                <CheckCircleIcon className="w-14 h-14 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-100">Connection Successful!</h2>
                <p className="text-slate-400 text-sm mt-1 mb-6 max-w-lg mx-auto">
                    You have successfully authenticated with Jules AI via GitHub.
                </p>

                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 max-w-md mx-auto">
                    <h3 className="text-base font-semibold text-slate-200 mb-3">Next Steps</h3>
                    <ul className="text-left space-y-2 text-slate-300">
                        <li className="flex items-start gap-3 text-sm">
                            <JulesLogo className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span>
                                Return to the Jules AI authentication window/tab in your browser to select a repository and create your first task.
                            </span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                            <span className="text-cyan-400 mt-1">&#8227;</span>
                            <span>All further interactions, such as creating tasks and reviewing code, will happen on the Jules AI website.</span>
                        </li>
                    </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-600 flex justify-between items-center">
                    <button
                        onClick={onBack}
                        className="px-6 py-2 text-sm font-semibold text-slate-200 bg-slate-600 rounded-lg shadow-sm hover:bg-slate-500 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        onClick={onReset}
                        className="w-auto inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition-colors"
                    >
                        Start Over
                    </button>
                </div>
            </div>
        );
    }
    
    if (isCopilot) {
        return (
            <div className="text-center">
                <CheckCircleIcon className="w-14 h-14 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-100">Project Ready to Launch!</h2>
                <p className="text-slate-400 text-sm mt-1 mb-6 max-w-lg mx-auto">
                    The repository is set up. Open it in your editor to start using GitHub Copilot.
                </p>

                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-xl mx-auto space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left block">Project Path</label>
                        <div className="mt-1 flex items-center gap-2 p-2 bg-slate-900 border border-slate-600 rounded-md shadow-sm">
                            <code className="text-sm text-slate-300 truncate">{projectPath}</code>
                            <button onClick={handleCopy} title="Copy path" className="ml-auto flex-shrink-0 p-1.5 text-slate-400 hover:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                {copied ? <ClipboardCheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                         <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left block">Launch Editor</label>
                         <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <a href={formatPathForVscodeUri(projectPath)} className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-semibold text-white bg-[#007ACC] rounded-lg shadow-sm hover:bg-[#006AB1] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007ACC]">
                                <VscodeIcon className="w-5 h-5" />
                                <span>Open with VS Code</span>
                            </a>
                             <div className="relative">
                                 <button disabled className="w-full h-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 bg-slate-600 rounded-lg cursor-not-allowed" aria-describedby="jetbrains-tooltip">
                                    <span>Open with JetBrains IDE</span>
                                </button>
                                <div id="jetbrains-tooltip" role="tooltip" className="invisible absolute z-10 -mt-20 -ml-12 px-2 py-1 text-xs font-medium text-white bg-slate-900 rounded-lg shadow-sm opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                                    Manual open required
                                </div>
                             </div>
                         </div>
                         <p className="text-xs text-slate-500 mt-2">For JetBrains (IntelliJ, WebStorm), use "File &gt; Open" and navigate to the path above.</p>
                         <p className="text-xs text-slate-500 mt-1">If "Open with VS Code" does not work, please open the application manually and use "File &gt; Open Folder".</p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-600 flex justify-between items-center">
                    <button
                        onClick={onBack}
                        className="px-6 py-2 text-sm font-semibold text-slate-200 bg-slate-600 rounded-lg shadow-sm hover:bg-slate-500 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        onClick={onReset}
                        className="w-auto inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition-colors"
                    >
                        Start Over
                    </button>
                </div>
            </div>
        );
    }

    const agentName = selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1);

    return (
        <div className="text-center">
            <CheckCircleIcon className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-100">Setup Complete!</h2>
            <p className="text-slate-400 text-sm mt-1 mb-6 max-w-lg mx-auto">
                Your Agent Harbor environment is ready. The {agentName} agent has executed your first task.
            </p>

            {lastTaskFile && (
                <div className="max-w-xl mx-auto mb-6 text-left bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <p className="text-sm text-slate-200 font-semibold mb-2">Generated Task File</p>
                    <p className="text-xs text-slate-400 mb-3">{lastTaskFile.filename}</p>
                    <a
                      href={URL.createObjectURL(new Blob([lastTaskFile.content], { type: 'text/markdown' }))}
                      download={lastTaskFile.filename.split('/').pop() || 'task.md'}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 rounded hover:bg-cyan-500"
                    >
                      Download File
                    </a>
                </div>
            )}

            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 max-w-md mx-auto">
                <h3 className="text-base font-semibold text-slate-200 mb-3">Next Steps</h3>
                <ul className="text-left space-y-2 text-slate-300">
                    <li className="flex items-start gap-3 text-sm">
                        <span className="text-cyan-400 mt-1">&#8227;</span>
                        <span>
                           Once the agent completes its work, you can review the code changes it made in your local repository.
                        </span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                        <span className="text-cyan-400 mt-1">&#8227;</span>
                        <span>
                            You can check the new branch created by the agent and see the code modifications.
                        </span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                        <span className="text-cyan-400 mt-1">&#8227;</span>
                        <span>To create more tasks, use the "Create Task" step of this wizard again or run `agent-task` from your terminal inside the project directory.</span>
                    </li>
                </ul>
            </div>

            {diffFiles.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto text-left">
                    <div className="md:col-span-1 bg-slate-800 border border-slate-700 rounded-lg p-3 max-h-80 overflow-auto">
                        <p className="text-sm text-slate-200 font-semibold mb-2">Changed Files</p>
                        <ul className="space-y-1">
                            {diffFiles.map((f, i) => (
                                <li key={f.path}>
                                    <button onClick={() => setActiveIdx(i)} className={`w-full text-left text-xs px-2 py-1 rounded ${activeIdx === i ? 'bg-cyan-900 text-cyan-100' : 'text-slate-300 hover:bg-slate-700'}`}>{f.path}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-2 bg-slate-900 border border-slate-700 rounded-lg p-3 max-h-80 overflow-auto">
                        <p className="text-sm text-slate-200 font-semibold mb-2">Unified Diff</p>
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap">{diffFiles[activeIdx]?.patch || ''}</pre>
                    </div>
                </div>
            )}

            <div className="mt-4">
                <a href={branchName ? `/api/task-archive?branch=${encodeURIComponent(branchName)}` : '#'}
                   className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 rounded hover:bg-cyan-500">
                   Download Changed Files (tar.gz)
                </a>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-600 flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="px-6 py-2 text-sm font-semibold text-slate-200 bg-slate-600 rounded-lg shadow-sm hover:bg-slate-500 transition-colors"
                >
                    Back to Task
                </button>
                <button
                    onClick={onReset}
                    className="w-auto inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition-colors"
                >
                    Start Over
                </button>
            </div>
        </div>
    );
};

export default SummaryStep;