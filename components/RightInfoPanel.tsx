import React from 'react';
import { Step } from '../types';

interface RightInfoPanelProps {
    currentStep: Step;
    selectedAgent: string;
    os?: string;
}

const InfoBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3">{title}</h3>
        <div className="text-sm text-slate-300 space-y-3">
            {children}
        </div>
    </div>
);

const RightInfoPanel: React.FC<RightInfoPanelProps> = ({ currentStep, selectedAgent, os }) => {
    const isWindows = os === 'win32';

    const renderContent = () => {
        switch (currentStep) {
            case Step.SystemCheck:
                return (
                    <>
                        <InfoBlock title="Why are these required?">
                            <p><strong>Git</strong> allows the agent to manage code history and work on new features in separate "branches," just like a human developer.</p>
                            <p><strong>Docker</strong> provides a clean, isolated, and repeatable environment, ensuring the agent works consistently on any machine.</p>
                            {!isWindows && <p><strong>Nix</strong> creates a reproducible development environment, eliminating "it works on my machine" problems by managing exact dependency versions.</p>}
                            {isWindows && <p><strong>Nix (via Docker)</strong> is used to create a reproducible development environment. On Windows, this is run inside Docker to ensure full compatibility without requiring a separate installation.</p>}
                        </InfoBlock>
                         <InfoBlock title="Tip">
                            <p>If Docker is installed but not detected, make sure the Docker Desktop application is fully started and running. You should see its icon in your system tray.</p>
                        </InfoBlock>
                    </>
                );
            case Step.SelectAgent:
                 return (
                    <>
                        <InfoBlock title="Which Agent to Choose?">
                           <p><strong>For Maximum Control (Self-Hosted):</strong> Choose agents like <strong>OpenHands</strong> to run everything on your own machine. This is great for privacy and understanding the whole process.</p>
                           <p><strong>For Quick Tasks (API-Based):</strong> Choose agents like <strong>Codex</strong> or <strong>Jules</strong> if you prefer not to run local containers. They are great for quick, specific coding problems.</p>
                           <p><strong>For In-Editor Help (IDE Extension):</strong> Choose <strong>GitHub Copilot</strong> if you want AI assistance directly inside your code editor, seamlessly integrated into your workflow.</p>
                        </InfoBlock>
                         <InfoBlock title="Next Step">
                            <p>After selecting an agent, the wizard will tailor the next steps. For OpenHands, you'll set up Agent Harbor. For an API-based agent, you'll provide an API key or authenticate.</p>
                        </InfoBlock>
                    </>
                );
            case Step.Setup:
                 return (
                    <>
                        <InfoBlock title="Project Location">
                           <p>The repository will be cloned into a folder named `agent-harbor-temp` inside the `server` directory of this wizard.</p>
                           <p>You can safely delete this folder later if you wish to restart the setup from scratch.</p>
                        </InfoBlock>
                        <InfoBlock title="Nix Environment">
                            <p>Agent Harbor uses <a href="https://nixos.org/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Nix</a> to create a reproducible development environment. This guarantees that all required tools are available at the correct versions, eliminating "it works on my machine" problems.</p>
                        </InfoBlock>
                    </>
                );
            case Step.ApiKey:
                const isJules = selectedAgent === 'jules';
                return (
                     <>
                        <InfoBlock title={isJules ? "GitHub Authentication" : "About API Keys"}>
                           {isJules ? 
                                <p>Jules uses a secure OAuth flow with GitHub. Clicking 'Connect' will open a popup directly to GitHub to authorize the application. This is a standard and secure practice.</p> :
                                <p>An API Key is like a password for applications. It proves to the AI service provider that you are a legitimate user with permission to access their models.</p>
                           }
                           <p><strong>Always keep your API keys and account access secure.</strong></p>
                        </InfoBlock>
                         <InfoBlock title="Next Step">
                            {isJules ? 
                                <p>After you authorize on GitHub, the popup will close and you can proceed to the summary.</p> :
                                <p>Once your key is saved, you'll proceed to creating a task for the agent.</p>
                            }
                        </InfoBlock>
                    </>
                );
            case Step.CreateTask:
                return (
                     <>
                        <InfoBlock title="Best Practices">
                           <p><strong>Be specific:</strong> Give the agent a clear, actionable goal. Instead of "improve the UI," try "add a blue login button to the top-right of the navigation bar."</p>
                           <p><strong>Use conventional branch names:</strong> Prefixes like `feature/`, `fix/`, or `docs/` are helpful for organizing your work.</p>
                        </InfoBlock>
                         <InfoBlock title="Next Step">
                            <p>After finishing this step, you will see a summary of the setup. The agent will have completed its task, and you can review its work in the cloned repository.</p>
                        </InfoBlock>
                    </>
                );
            case Step.Summary:
                if (selectedAgent === 'jules') {
                     return (
                        <>
                            <InfoBlock title="What has been done?">
                               <p>The wizard has successfully: </p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Verified your system environment.</li>
                                    <li>Guided you through the GitHub authentication for Jules AI.</li>
                                </ul>
                            </InfoBlock>
                            <InfoBlock title="Start Over">
                                <p>Clicking "Start Over" will reset the wizard to the first step. It does not disconnect you from Jules AI.</p>
                            </InfoBlock>
                        </>
                    );
                }
                 return (
                    <>
                        <InfoBlock title="What has been done?">
                           <p>The wizard has successfully: </p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Verified your system environment.</li>
                                {selectedAgent === 'copilot' ? (
                                    <li>Prepared the project folder for use.</li>
                                ) : (
                                    <>
                                        <li>Cloned the Agent Harbor repository.</li>
                                        <li>Executed your first task using the selected agent.</li>
                                    </>
                                )}
                            </ul>
                        </InfoBlock>
                        <InfoBlock title="Start Over">
                            <p>Clicking "Start Over" will reset the wizard to the first step. This is useful for running a new task or choosing a different agent.</p>
                        </InfoBlock>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-slate-700 h-full rounded-xl border border-slate-600 p-6 shadow-sm">
            {renderContent()}
        </div>
    );
};

export default RightInfoPanel;