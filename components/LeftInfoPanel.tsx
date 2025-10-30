import React from 'react';
import { Step } from '../types';

interface LeftInfoPanelProps {
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

const LeftInfoPanel: React.FC<LeftInfoPanelProps> = ({ currentStep, selectedAgent, os }) => {
    const isWindows = os === 'win32';

    const renderContent = () => {
        switch (currentStep) {
            case Step.SystemCheck:
                return (
                    <>
                        <InfoBlock title="Step 1: System Check">
                            <p>This initial step ensures your computer has the necessary software to run Agent Harbor and its AI agents.</p>
                            <p>We'll automatically check for <strong>Git</strong> (version control) and <strong>Docker</strong> (sandboxed environments){isWindows ? '.' : ', and <strong>Nix</strong> (reproducible setups).'}</p>
                        </InfoBlock>
                        <InfoBlock title="What's Happening">
                             <p>The wizard is communicating with your system to see if the required commands are available. If Docker isn't running, it will periodically re-check, so you just need to start your Docker Desktop.</p>
                        </InfoBlock>
                    </>
                );
            case Step.SelectAgent:
                 return (
                    <>
                        <InfoBlock title="Step 2: Select Agent">
                           <p>Here you can choose from a variety of AI agents. Each agent has a different specialty and method of operation.</p>
                           <p>Your choice will determine the next steps in the wizard. For example, a <strong>Self-Hosted</strong> agent requires a setup step, while an <strong>IDE Extension</strong> agent will guide you to your code editor.</p>
                        </InfoBlock>
                        <InfoBlock title="Agent Types">
                            <p><strong>Self-Hosted:</strong> Runs locally using scripts. Offers maximum control and privacy.</p>
                            <p><strong>API-Based:</strong> Connects to a cloud service. Requires an API key but no local setup.</p>
                            <p><strong>IDE Extension:</strong> Integrates directly with your code editor (e.g., VS Code).</p>
                        </InfoBlock>
                    </>
                );
            case Step.Setup:
                 return (
                    <>
                        <InfoBlock title="Step 3: Harbor Setup">
                            <p>This is a one-time setup process for the Agent Harbor workflow system. The wizard is now preparing the necessary files and environment.</p>
                            <p>This involves cloning the <strong>Agent Harbor</strong> project from GitHub, which contains all the scripts needed to manage and run tasks with different AI agents.</p>
                        </InfoBlock>
                        <InfoBlock title="Technical Process">
                           <p>The wizard initiates a `git clone` command to download the Agent Harbor repository into a local folder. This gives you a local copy of all the tools needed for the next steps.</p>
                        </InfoBlock>
                    </>
                );
            case Step.ApiKey:
                const isJules = selectedAgent === 'jules';
                return (
                    <>
                        <InfoBlock title={`Step 4: ${isJules ? 'Connect to Jules' : 'Configure API Key'}`}>
                           <p>
                             {isJules 
                                ? "Jules uses GitHub for authentication instead of a traditional API key. This step will guide you through connecting your GitHub account."
                                : "API-based agents need a 'key' to grant you access to their services. This step securely saves your key for the agent to use."
                             }
                           </p>
                        </InfoBlock>
                        <InfoBlock title="Security">
                            <p>
                                {isJules
                                    ? "The authentication process is handled securely by GitHub. This wizard only opens the connection window; it never sees your credentials."
                                    : "Your API key is stored locally in a `config.json` file within the server directory. It is only used to communicate with the respective AI service."
                                }
                            </p>
                        </InfoBlock>
                    </>
                );
            case Step.CreateTask:
                return (
                    <>
                        <InfoBlock title="Step 5: Create Task">
                           <p>Now you can give the agent a specific task to perform. This mimics a real-world development workflow.</p>
                           <p>You'll provide a descriptive goal and a new <strong>Git branch name</strong> for the agent to work on. This keeps the agent's changes isolated from your main codebase.</p>
                        </InfoBlock>
                        <InfoBlock title="Agent Harbor Workflow">
                           <p>When you run the task, the wizard uses the `agent-task` script from the Agent Harbor repository. This script handles creating the branch, preparing the environment, and dispatching your instructions to the selected AI agent.</p>
                        </InfoBlock>
                    </>
                );
            case Step.Summary:
                if (selectedAgent === 'jules') {
                    return (
                        <>
                            <InfoBlock title="Final Step: Summary">
                               <p>The authentication process with Jules AI is complete! This wizard's job is done.</p>
                            </InfoBlock>
                            <InfoBlock title="What's Next?">
                                <p>You will now manage your tasks directly within the <strong>Jules AI web interface</strong>, which you authenticated in the popup window.</p>
                                <p>This wizard has successfully established the connection, and now you can proceed on their platform.</p>
                            </InfoBlock>
                        </>
                    );
                }
                 return (
                    <>
                        <InfoBlock title="Final Step: Summary">
                           <p>The setup process is complete! This screen provides a summary and your next steps based on the agent you selected.</p>
                        </InfoBlock>
                        <InfoBlock title="What's Next?">
                            {selectedAgent === 'copilot' ? 
                                <p>Open the project path in your favorite code editor and the <strong>GitHub Copilot</strong> extension will be ready to assist you as you code.</p> :
                                <p>The task has been executed by the agent. You can now inspect the new branch in your local Agent Harbor repository to see the code changes.</p>
                            }
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

export default LeftInfoPanel;