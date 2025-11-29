# Agent Harbor Wizard 🚀

A modern, web-based user interface for **Agent Harbor** - making AI-powered coding agents accessible to everyone through an intuitive setup wizard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [Supported AI Agents](#supported-ai-agents)
- [Known Issues](#known-issues)
- [Development](#development)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Agent Harbor Wizard is a web-based application that simplifies the setup and management of [Agent Harbor](https://github.com/blocksense-network/agent-harbor) and its integrated AI coding agents. Instead of dealing with complex CLI commands, users can complete the entire setup process through an intuitive step-by-step wizard.

**Perfect for:**
- Developers new to Agent Harbor
- Teams wanting a standardized setup process
- Users who prefer GUI over CLI
- Quick testing of different AI agents

## 🎯 Wizard Scope

> **Update**: This wizard now provides **Timeline, Fork, and Parallel Task** capabilities alongside onboarding features!

### What the Wizard Provides ✅

| Feature | Description |
|---------|-------------|
| **System Checks** | Automatic detection of Git, Docker, Nix, VS Code |
| **Repository Setup** | One-click Agent Harbor cloning and configuration |
| **Agent Selection** | Visual interface for choosing AI agents |
| **API Key Management** | Secure, agent-specific API key storage |
| **Task Creation** | Simple form-based task definition with examples |
| **Timeline Viewer** | 🆕 View task history, snapshots, and execution timeline |
| **Fork & Branch** | 🆕 Fork tasks from any snapshot with new instructions |
| **Parallel Tasks** | 🆕 Create and monitor up to 10 concurrent tasks |
| **Real-time Monitoring** | Live terminal output and log viewing |
| **Docker Fallback** | Automatic Docker-based execution when Nix unavailable |

### Advanced Features (NEW!)

#### 📊 Timeline Management
- **View all tasks**: See complete task history with status
- **Snapshots**: View filesystem snapshots at each execution step
- **Rewind**: Restore to any previous snapshot state
- **Fork from timeline**: Create alternative execution branches
- **Parent tracking**: See which tasks were forked from where

#### ⚡ Parallel Task Execution
- **Batch creation**: Create up to 10 tasks simultaneously
- **Multi-task monitoring**: Grid view of all active tasks
- **Individual controls**: Cancel, monitor logs per task
- **Aggregate statistics**: Total, running, completed, failed counts
- **Max 10 limit**: Enforced at UI and backend levels

#### 🌿 Fork & Branch Workflow
- **Fork dialog**: Easy interface for task forking
- **New branch naming**: Specify alternative approach branch
- **Custom instructions**: Provide new prompts for forked tasks
- **Result comparison**: Compare different execution paths

### What Requires the Native CLI/TUI ⚙️

For features not yet in the wizard:

```bash
# Advanced timeline inspection
ah timeline show --detailed

# Cluster mode operations
ah cluster status

# Complex orchestration patterns
ah supervisor --multi-timeline
```

### Relationship to Agent Harbor

```
Agent Harbor (Core Platform)
├── ah CLI (Command-line power users)
├── ah tui (Terminal dashboard - Advanced features)
└── Agent Harbor Wizard (Web GUI) ← This Project
    ├── Calls ah CLI underneath
    ├── All core features work (AgentFS, sandboxing, snapshots)
    ├── Timeline & Fork management (NEW!)
    └── Parallel task orchestration (NEW!)
```

**The wizard is now a comprehensive Agent Harbor interface** providing timeline management, parallel execution, and fork capabilities through an intuitive web UI.

## ✨ Features

### 🔍 System Prerequisite Check
- Automatic detection of Git, Docker, Nix, and VS Code
- Clear installation instructions with direct download links
- Real-time status updates
- Smart fallback options (Docker when Nix unavailable)

### 🤖 Agent Selection
- Visual agent selector with descriptions
- Support for multiple AI providers:
  - Claude Code (Anthropic)
  - Google Gemini
  - OpenAI Codex
  - Cursor CLI
  - GitHub Copilot
  - And more!

### 🔧 Repository Setup
- One-click Agent Harbor repository cloning
- Automatic repository detection
- Git status monitoring

### 🔑 API Key Management
- Secure API key configuration
- Agent-specific setup instructions
- Direct links to API key pages
- Persistent configuration storage

### 📝 Task Creation
- **3 Quick Start Examples** - Pre-filled task templates for testing
- GitHub authentication (optional)
- Branch name and description editor
- YOLO mode for auto-approval
- Real-time task execution logs

### 📈 Timeline Management
- **Task History Viewer** - See all tasks with status and metadata
- **Snapshot Navigation** - View filesystem state at each execution step
- **Rewind Functionality** - Restore to any previous snapshot
- **Fork from Timeline** - Create alternative execution branches
- **Parent Task Tracking** - Visual indicators for forked tasks

### ⚡ Parallel Task Execution
- **Batch Task Creation** - Create up to 10 tasks simultaneously
- **Multi-Task Grid** - Monitor all tasks in real-time
- **Individual Log Viewing** - Expand any task to see its logs
- **Aggregate Statistics** - Total, running, completed, failed counts
- **Task Cancellation** - Stop individual running tasks

### 🌿 Fork & Branch Workflow
- **Fork Dialog** - Easy interface for task forking
- **Branch Naming** - Specify new branch for alternative approach
- **Custom Instructions** - Provide different prompts for forked execution
- **Parent Linking** - Forked tasks show their origin

### 📊 Task Monitoring
- Live terminal output via xterm.js
- Task status tracking
- Process control (pause/resume/cancel)

### 🎨 Modern UI
- Clean, responsive design with Tailwind CSS
- Light theme with excellent readability
- Real-time feedback and error handling
- Professional icons from Heroicons

## 🚀 Quick Start

### Method 1: Windows Quick Start (Recommended)

Simply double-click `start.bat` in the project folder. It will:
- Check for Node.js
- Install dependencies if needed
- Start the development server
- Open at `http://localhost:5173`

### Method 2: Manual Setup

1. **Clone the repository:**
```bash
git clone https://github.com/laedrianus/agent-harbor-wizard.git
cd agent-harbor-wizard
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
```
http://localhost:5173
```

The wizard will guide you through:
- System prerequisite checks (Git, Docker, Nix)
- Agent Harbor repository setup
- Agent selection and API key configuration  
- Task creation and monitoring

## 📦 Prerequisites

The wizard will guide you through checking these requirements:

### Required
- **Git** (2.0+) - Version control system
- **Docker** (20.0+) - Container platform for running agents

### Optional
- **Nix** - Package manager for native `ah` CLI
  - Not required on Windows - Docker will be used automatically
  - Recommended on macOS/Linux for better performance
- **VS Code** - Recommended code editor

### Hybrid Approach

This wizard uses a **hybrid approach** for running Agent Harbor:

1. **Native Mode** (Best Performance): Uses native `ah` CLI if Nix is installed
2. **Docker Fallback** (Universal): Runs `ah` CLI inside Docker container

This means:
- ✅ **Windows users**: No WSL2 required! Docker is sufficient
- ✅ **macOS/Linux users**: Choose native Nix or Docker
- ✅ **Cross-platform**: Works everywhere Docker runs

## 💻 Installation

### Method 1: Quick Start Scripts (Recommended)

**Windows:**
```cmd
start.bat
```

**macOS/Linux:**
```bash
chmod +x start.sh && ./start.sh
```

### Method 2: Manual Installation

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/agent-harbor-wizard.git
cd agent-harbor-wizard
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
```
http://localhost:5173
```

## 📖 Usage Guide

### Step-by-Step Wizard Flow

#### 1️⃣ System Check
- The wizard automatically checks for required tools
- Click "Re-check" if you install something during the process
- All required checks must pass to continue

#### 2️⃣ Select Agent
- Choose your preferred AI coding agent
- Each agent shows its capabilities and requirements
- Claude, Gemini, and Cursor require API keys

#### 3️⃣ Setup Repository
- Click "Clone Repository" to download Agent Harbor
- Or skip if already installed
- The wizard detects existing installations

#### 4️⃣ Configure API Key (if needed)
- Enter your API key for the selected agent
- Links provided to get API keys
- Keys are stored locally in `server/config.json`

#### 5️⃣ Create Task
- **Try Quick Start Examples!** Click any example to auto-fill the form
- Enter branch name (e.g., `feature/add-button`)
- Describe what you want the agent to do
- Optional: Enable GitHub push
- Optional: Enable YOLO mode (auto-approve)
- Click "Run Task"

#### 6️⃣ Monitor Task
- Watch real-time terminal output
- See task progress and logs
- Control running tasks (pause/resume/cancel)

## 🤖 Supported AI Agents

| Agent | Provider | API Key Required | Status |
|-------|----------|------------------|--------|
| **Claude Code** | Anthropic | ✅ Yes | ✅ Tested |
| **Google Gemini** | Google | ✅ Yes | ✅ Tested |
| **Cursor** | Cursor | ✅ Yes | ✅ Tested |
| **OpenAI Codex** | OpenAI | ✅ Yes | ⚠️ Partial |
| **Goose AI** | Goose | ❌ No | ⚠️ Experimental |

## ⚠️ Known Issues

### Agent Harbor Build Error (Upstream Issue)

**Status:** Reported to Agent Harbor team

Currently, installing Agent Harbor via Nix flake may fail with:
```
error: A hash was specified for rmcp-0.9.0, but there is no corresponding git dependency.
```

**Workaround:** The wizard handles this by using Docker-based execution.

**Issue Tracking:** See [github_issue_final.md](path/to/artifact) for detailed report

**Impact:** 
- ❌ Native Nix installation blocked
- ✅ Docker fallback works fine
- ✅ All wizard features functional

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start dev server (client + server)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
npm run format       # Auto-format code with Prettier
npm test             # Run tests
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Socket.IO for real-time communication
- xterm.js for terminal emulation
- Vite for blazing-fast builds

**Backend:**
- Node.js with Express
- Socket.IO for WebSocket
- Dockerode for Docker integration

### Code Quality Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Jest**: Unit testing

### Environment Variables

Create a `.env` file (optional):

```env
# Client URL (default: http://localhost:5173)
CLIENT_URL=http://localhost:5173

# Server port (default: 3001)
PORT=3001
```

## 📁 Project Structure

```
agent-harbor-wizard/
├── components/              # React UI components
│   ├── SystemCheckStep.tsx    # System prerequisites checker
│   ├── SelectAgentStep.tsx    # Agent selection interface
│   ├── SetupStep.tsx          # Repository setup
│   ├── ApiKeyStep.tsx         # API key configuration
│   ├── CreateTaskStep.tsx     # Task creation form
│   ├── TaskMonitor.tsx        # Task monitoring interface
│   ├── TuiTerminal.tsx        # Terminal emulator
│   ├── LogViewer.tsx          # Log display component
│   ├── ErrorBoundary.tsx      # Error handling
│   └── ...
├── server/                  # Backend server
│   ├── index.js               # Server entry point
│   ├── socket.js              # WebSocket handlers
│   ├── routes.js              # REST API routes
│   ├── services/              # Business logic
│   │   ├── ahService.js       # Agent Harbor CLI integration
│   │   ├── dockerService.js   # Docker operations
│   │   └── gitService.js      # Git operations
│   └── utils/                 # Helper functions
├── types.ts                 # TypeScript type definitions
├── App.tsx                  # Main React application
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind CSS config
├── vite.config.ts           # Vite configuration
├── start.bat                # Windows quick start
├── start.sh                 # Unix quick start
└── README.md                # This file
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs**: Open an issue describing the problem
2. **Suggest Features**: Share your ideas for improvements
3. **Submit PRs**: Fork, create a branch, make changes, and submit
4. **Improve Docs**: Help make documentation clearer
5. **Test**: Try the wizard and report your experience

### Development Guidelines

- Follow existing code style (ESLint + Prettier)
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Agent Harbor Team** - For the amazing AI agent framework
- **Blocksense Network** - For Agent Harbor development
- **Open Source Community** - For the tools that make this possible

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/agent-harbor-wizard/issues)
- **Agent Harbor**: [Official Repository](https://github.com/blocksense-network/agent-harbor)
- **Documentation**: [Agent Harbor Docs](https://github.com/blocksense-network/agent-harbor#readme)

---

**Made with ❤️ to make AI coding agents accessible to everyone**

*Note: This is an independent project created to improve Agent Harbor's user experience. Not officially affiliated with Blocksense Network.*