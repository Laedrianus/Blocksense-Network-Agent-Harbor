import React, { useState } from 'react';
import { CheckCircleIcon, OpenHandsLogo, OpenAILogo, CopilotLogo, GooseAILogo, JulesLogo } from './IconComponents';

interface Agent {
    id: string;
    name: string;
    description: string;
    type: 'Self-Hosted' | 'API-Based' | 'IDE Extension';
}

const supportedAgents: Agent[] = [
    {
        id: 'openhands',
        name: 'OpenHands',
        description: 'Execute complex, multi-step tasks on your local machine to complete a development request.',
        type: 'Self-Hosted',
    },
    {
        id: 'copilot',
        name: 'GitHub Copilot',
        description: 'The well-known AI pair programmer from GitHub that integrates directly into your code editor.',
        type: 'IDE Extension'
    },
    {
        id: 'codex',
        name: 'Codex',
        description: "OpenAI's powerful code-generation model. Excellent for snippets and solving programming problems.",
        type: 'API-Based',
    },
    {
        id: 'jules',
        name: 'Jules',
        description: 'An AI pair programming assistant designed to help with a wide variety of development tasks.',
        type: 'API-Based',
    },
    {
        id: 'goose',
        name: 'GooseAI',
        description: 'An AI-powered development tool focused on providing efficient and affordable language model access.',
        type: 'API-Based',
    },
];

interface SelectAgentStepProps {
    onSelect: (agentId: string) => void;
    onBack: () => void;
    socket: import('socket.io-client').Socket;
    selectedAgent: string;
}

const AgentBadge: React.FC<{ type: Agent['type'] }> = ({ type }) => {
    const typeStyles: Record<Agent['type'], string> = {
        'Self-Hosted': 'bg-amber-900 text-amber-200',
        'API-Based': 'bg-sky-900 text-sky-200',
        'IDE Extension': 'bg-indigo-900 text-indigo-200',
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeStyles[type]}`}>
            {type}
        </span>
    );
};

const AgentLogo: React.FC<{ agentId: string, className?: string }> = ({ agentId, className }) => {
    switch (agentId) {
        case 'openhands':
            return <OpenHandsLogo className={className} />;
        case 'codex':
            return <OpenAILogo className={className} />;
        case 'copilot':
            return <CopilotLogo className={className} />;
        case 'goose':
            return <GooseAILogo className={className} />;
        case 'jules':
            return <JulesLogo className={className} />;
        default:
            return null;
    }
};

const SelectAgentStep: React.FC<SelectAgentStepProps> = ({ onSelect, onBack, socket }) => {
    const [selectedId, setSelectedId] = useState<string | null>('openhands');
    const [prefetching, setPrefetching] = useState(false);
    const [prefetchLog, setPrefetchLog] = useState<string>('');

    return (
        <div className="flex flex-col h-full">
             <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-100">Select an Agent</h2>
                <p className="text-center text-slate-400 text-sm mt-1">Choose the AI agent you want to work with.</p>
            </div>
            {selectedId === 'openhands' && (
                <div className="mt-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                    <p className="text-sm text-slate-300 font-medium">OpenHands requires a Docker image.</p>
                    <p className="text-xs text-slate-400 mt-1">You can pre-download it now to avoid delays during task run.</p>
                    <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          disabled={prefetching}
                          onClick={() => { setPrefetching(true); setPrefetchLog(''); socket.emit('agent:openhands:prefetch'); socket.once('setup:log', (log: any) => { setPrefetchLog((prev) => (prev ? prev + '\n' : '') + (log?.message || '')); setPrefetching(false); }); }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 rounded hover:bg-cyan-500 disabled:bg-slate-500"
                        >
                          {prefetching ? 'Prefetching...' : 'Prefetch Image'}
                        </button>
                        <span className="text-xs text-slate-400">Uses image from server/config.json</span>
                    </div>
                    {prefetchLog && <pre className="mt-2 text-xs text-slate-300 whitespace-pre-wrap max-h-32 overflow-auto">{prefetchLog}</pre>}
                </div>
            )}
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 content-start">
                {supportedAgents.map((agent) => (
                    <button
                        key={agent.id}
                        onClick={() => setSelectedId(agent.id)}
                        className={`group relative w-full p-4 bg-slate-800 rounded-xl border-2 text-left hover:shadow-lg transition-all flex flex-col ${selectedId === agent.id ? 'border-cyan-500 ring-2 ring-cyan-700' : 'border-slate-700 hover:border-slate-600'}`}
                    >
                        {selectedId === agent.id && (
                            <CheckCircleIcon className="absolute -top-2 -right-2 w-6 h-6 text-cyan-400 bg-slate-800 rounded-full" />
                        )}
                        <div className="flex justify-between items-start">
                             <AgentLogo agentId={agent.id} className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                             <AgentBadge type={agent.type} />
                        </div>
                        <div className="mt-3 flex flex-col flex-grow">
                            <h3 className="text-sm font-semibold text-slate-200">{agent.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 flex-grow">{agent.description}</p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-600 flex-shrink-0 flex justify-between items-center">
                 <button
                    onClick={onBack}
                    className="px-6 py-2 text-sm font-semibold text-slate-200 bg-slate-600 rounded-lg shadow-sm hover:bg-slate-500 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={() => { if (selectedId) onSelect(selectedId); }}
                    disabled={!selectedId}
                    className="px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default SelectAgentStep;