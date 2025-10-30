import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { OpenAILogo, GooseAILogo, JulesLogo, CheckCircleIcon } from './IconComponents';

interface ApiKeyStepProps {
    apiKey: string;
    setApiKey: React.Dispatch<React.SetStateAction<string>>;
    onComplete: () => void;
    onBack: () => void;
    selectedAgent: string;
}

const ApiKeyStep: React.FC<ApiKeyStepProps> = ({ apiKey, setApiKey, onComplete, onBack, selectedAgent }) => {
    const [localApiKey, setLocalApiKey] = useState(apiKey);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [authPopupOpened, setAuthPopupOpened] = useState(false);


    // If the parent apiKey changes (e.g., from a previous session), update the local one.
    useEffect(() => {
        setLocalApiKey(apiKey);
    }, [apiKey]);
    
    // Reset saved state if key changes
    useEffect(() => {
        setIsSaved(false);
    }, [localApiKey]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localApiKey) {
            setError('API key cannot be empty.');
            return;
        }

        setIsSaving(true);
        setError(null);
        setIsSaved(false);

        try {
            const response = await fetch('/api/api-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: localApiKey }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save API key.');
            }
            
            setApiKey(localApiKey); // Update parent state
            setIsSaved(true);

        } catch (err: any) {
            setError(err.message);
            setIsSaved(false);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleConnectJules = () => {
        // This is the necessary intermediate page that generates the secure GitHub URL with a state token.
        const julesAuthUrl = 'https://jules.google.com/session';
        const width = 600;
        const height = 700;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        window.open(julesAuthUrl, 'julesAuth', `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`);
        setAuthPopupOpened(true);
    };

    const agentDetails: { [key: string]: { name: string; url: string; logo: React.ReactNode } } = {
        codex: {
            name: 'OpenAI',
            url: 'https://platform.openai.com/api-keys',
            logo: <OpenAILogo className="w-6 h-6" />,
        },
        goose: {
            name: 'GooseAI',
            url: 'https://goose.ai/dashboard/apikeys',
            logo: <GooseAILogo className="w-6 h-6" />,
        },
        openhands: {
            name: 'OpenAI (for OpenHands)',
            url: 'https://platform.openai.com/api-keys',
            logo: <OpenAILogo className="w-6 h-6" />,
        },
    };

    const currentAgent = agentDetails[selectedAgent] || { name: 'the selected service', url: '#', logo: null };
    
    if (selectedAgent === 'jules') {
        return (
            <div className="flex flex-col h-full text-center">
                <div className="flex-grow flex flex-col items-center justify-center">
                    <JulesLogo className="w-12 h-12 text-slate-300 mb-4" />
                    {!authPopupOpened ? (
                        <>
                            <h2 className="text-xl font-bold text-slate-100">Connect to Jules AI</h2>
                            <p className="text-slate-400 text-sm mt-1 mb-6 max-w-md mx-auto">
                                Jules AI uses your GitHub account for authentication. Click the button below to open the connection window.
                            </p>
                            <button
                                onClick={handleConnectJules}
                                className="inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-slate-700 rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-800 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.201 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                                </svg>
                                Connect with GitHub
                            </button>
                        </>
                    ) : (
                         <>
                            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-slate-100">Awaiting Connection</h2>
                            <p className="text-slate-400 text-sm mt-1 mb-6 max-w-md mx-auto">
                                The connection window has been opened. Please complete the sign-in process with GitHub in that window. Once you're done, you can proceed.
                            </p>
                        </>
                    )}
                </div>

                <div className="flex-shrink-0 mt-6 pt-6 border-t border-slate-600 flex justify-between items-center">
                    <button onClick={onBack} className="px-6 py-2 text-sm font-semibold text-slate-200 bg-slate-600 rounded-lg shadow-sm hover:bg-slate-500 transition-colors">
                        Back
                    </button>
                    <button onClick={onComplete} disabled={!authPopupOpened} className="px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors">
                        Next
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="flex flex-col h-full">
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-slate-100">Provide API Key</h2>
                <p className="text-center text-slate-400 text-sm mt-1 max-w-lg mx-auto">
                    To use the <strong>{currentAgent.name}</strong> agent, you need to provide an API key. This key will be stored securely on the server.
                </p>
            </div>
            
            <div className="flex-grow max-w-md mx-auto w-full">
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label htmlFor="api-key" className="block text-sm font-medium text-slate-300">
                                {currentAgent.name} API Key
                            </label>
                            <a href={currentAgent.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">
                                Get your key here
                            </a>
                        </div>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                id="api-key"
                                value={localApiKey}
                                onChange={(e) => setLocalApiKey(e.target.value)}
                                className="w-full bg-slate-900 text-slate-200 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder="sk-..."
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-200"
                            >
                                {showKey ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        <path d="M10 17a9.953 9.953 0 01-4.542-1.074l-1.78-1.781a1 1 0 011.414-1.414l1.664 1.664A8.006 8.006 0 0010 15c4.478 0 8.268-2.943 9.542-7a9.95 9.95 0 00-1.481-3.243l-1.83 1.83A8.003 8.003 0 0110 15a7.96 7.96 0 01-2.733-.51l-1.337-1.337a6.006 6.006 0 00-1.28.51 1 1 0 01-1.414-1.414l.118-.118a10.014 10.014 0 01-2.94-3.212c-.225.26-.44.526-.645.798C1.732 5.943 5.522 3 10 3a9.958 9.958 0 014.512 1.074l1.78 1.781a1 1 0 01-1.414 1.414l-1.664-1.664A8.006 8.006 0 0010 5c-4.478 0-8.268 2.943-9.542 7 .225.26.44.526.645.798a9.908 9.908 0 002.94 3.212l-.118.118z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving || isSaved}
                        className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition-colors"
                    >
                        {isSaving ? <Spinner className="w-5 h-5 mr-2" /> : null}
                        {isSaving ? 'Saving...' : isSaved ? 'Key Saved' : 'Save Key'}
                    </button>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    {isSaved && <p className="text-green-400 text-sm text-center">API Key saved successfully! You can now proceed.</p>}
                </form>
            </div>

            <div className="flex-shrink-0 mt-6 pt-6 border-t border-slate-600 flex justify-between items-center">
                <button
                    onClick={onBack}
                    disabled={isSaving}
                    className="px-6 py-2 text-sm font-semibold text-slate-200 bg-slate-600 rounded-lg shadow-sm hover:bg-slate-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onComplete}
                    disabled={!isSaved || isSaving}
                    className="px-6 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default ApiKeyStep;