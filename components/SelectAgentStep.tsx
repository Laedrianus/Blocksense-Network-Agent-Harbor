import React, { useState } from 'react';
import { CheckCircleIcon, OpenAILogo, CopilotLogo, GooseAILogo, JulesLogo } from './IconComponents';

interface Agent {
    id: string;
    name: string;
    description: string;
    type: 'Self-Hosted' | 'API-Based' | 'IDE Extension';
}

const supportedAgents: Agent[] = [
    {
        id: 'claude',
        name: 'Claude Code',
        description: 'Anthropic\'s Claude AI with advanced coding capabilities. Excellent for complex reasoning and code generation.',
        type: 'API-Based',
    },
    {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Google\'s multimodal AI model with strong coding and reasoning abilities.',
        type: 'API-Based',
    },
    {
        id: 'codex',
        name: 'OpenAI Codex',
        description: "OpenAI's powerful code-generation model. Excellent for snippets and solving programming problems.",
        type: 'API-Based',
    },
    {
        id: 'cursor',
        name: 'Cursor',
        description: 'AI-first code editor with powerful code generation and editing capabilities.',
        type: 'IDE Extension',
    },
    {
        id: 'copilot',
        name: 'GitHub Copilot',
        description: 'The well-known AI pair programmer from GitHub that integrates directly into your code editor.',
        type: 'IDE Extension'
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
        case 'claude':
            return <OpenAILogo className={className} />; // Using OpenAI logo as placeholder
        case 'gemini':
            return <OpenAILogo className={className} />; // Using OpenAI logo as placeholder
        case 'codex':
            return <OpenAILogo className={className} />;
        case 'cursor':
            return <CopilotLogo className={className} />; // Using Copilot logo as placeholder
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

export default function SelectAgentStep({ onSelect, onBack, selectedAgent }: SelectAgentStepProps) {
    const [selectedId, setSelectedId] = useState<string>(selectedAgent || '');
    const [error, setError] = useState<string | null>(null);

    const handleSelectAgent = (agentId: string) => {
        setSelectedId(agentId);
        setError(null);
    };

    const handleContinue = () => {
        if (!selectedId) {
            setError('Please select an AI agent to continue.');
            return;
        }
        onSelect(selectedId);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Select an Agent</h2>
                <p className="text-center text-slate-600 text-sm mt-1">Choose the AI agent you want to work with.</p>
            </div>
            {selectedId === 'claude' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">Claude Code requires an Anthropic API key.</p>
                    <p className="text-xs text-blue-600 mt-1">You'll configure this in the next step.</p>
                </div>
            )}
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 content-start">
                {supportedAgents.map((agent) => (
                    <button
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent.id)}
                        className={`group relative w-full p-4 bg-white rounded-xl border-2 text-left hover:shadow-lg transition-all flex flex-col ${selectedId === agent.id ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                        {selectedId === agent.id && (
                            <CheckCircleIcon className="absolute -top-2 -right-2 w-6 h-6 text-cyan-500 bg-white rounded-full" />
                        )}
                        <div className="flex justify-between items-start">
                            <AgentLogo agentId={agent.id} className="w-8 h-8 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                            <AgentBadge type={agent.type} />
                        </div>
                        <div className="mt-3 flex flex-col flex-grow">
                            <h3 className="text-sm font-semibold text-slate-800">{agent.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 flex-grow">{agent.description}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            {/* Bottom navigation buttons */}
            <div className="flex gap-4 mt-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!selectedId}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium ${selectedId
                        ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}