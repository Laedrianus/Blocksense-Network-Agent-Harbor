const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { spawn } = require('child_process');
const Docker = require('dockerode');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
    }
});

const isWindows = process.platform === 'win32';
let docker = null; // Initialize to null, will be set after async initialization

const REPO_DIR_NAME = 'agent-harbor-temp';
const REPO_DIR_PATH = path.resolve(__dirname, REPO_DIR_NAME);
const CONFIG_PATH = path.join(__dirname, 'config.json');

// Function to initialize Docker with fallback for Windows socket paths
const initializeDocker = async () => {
    try {
        if (isWindows) {
            const windowsSockets = [
                '//./pipe/dockerDesktopLinuxEngine', // Common with WSL2 backend
                '//./pipe/docker_engine' // Older path
            ];
            for (const socketPath of windowsSockets) {
                try {
                    const testDocker = new Docker({ socketPath });
                    await testDocker.ping();
                    console.log(`Successfully connected to Docker at ${socketPath}`);
                    return testDocker;
                } catch (e) {
                    // console.log(`Failed to connect to Docker at ${socketPath}. Trying next...`);
                }
            }
            // console.warn("Could not connect to any known Docker socket on Windows.");
            return null; // Return null instead of throwing
        } else {
            const socketPath = '/var/run/docker.sock';
            const linuxDocker = new Docker({ socketPath });
            await linuxDocker.ping();
            return linuxDocker;
        }
    } catch (error) {
        console.warn("An unexpected error occurred during Docker initialization.", error);
        return null;
    }
};


const readConfig = () => {
    if (fsSync.existsSync(CONFIG_PATH)) {
        const rawData = fsSync.readFileSync(CONFIG_PATH);
        return JSON.parse(rawData);
    }
    return {};
};

const writeConfig = (data) => {
    const currentConfig = readConfig();
    const newConfig = { ...currentConfig, ...data };
    fsSync.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
};

const { execSync } = require('child_process');
const zlib = require('zlib');
const tar = require('tar-fs');

const gitDiffFiles = (branch, cwd) => {
    try {
        const out = execSync(`git diff --name-only ${branch}~1..${branch}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] });
        return out.toString().trim().split(/\r?\n/).filter(Boolean);
    } catch {
        return [];
    }
};

const gitDiffPatchByFile = (branch, filePath, cwd) => {
    try {
        const out = execSync(`git diff ${branch}~1..${branch} -- "${filePath}"`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] });
        return out.toString();
    } catch {
        return '';
    }
};

const runCommand = (command, args, options = {}) => {
    const { socket, eventName, cwd = '.', env = null, isCheck = false } = options;
    return new Promise((resolve, reject) => {
        const processOptions = { cwd, shell: false };
        if (env) {
            processOptions.env = { ...process.env, ...env };
        }
        
        console.log(`Running command: ${command} ${args.join(' ')} in ${cwd}`);
        const proc = spawn(command, args, processOptions);
        const isGitProgressCommand = command === 'git' && (args.includes('clone') || args.includes('pull'));

        const emit = (type, message) => {
            const logEntry = {
                id: Date.now() + Math.random(),
                timestamp: new Date().toLocaleTimeString(),
                message: message.toString().trim(),
                type,
            };
            if (socket && eventName) socket.emit(eventName, logEntry);
            else console.log(`[${type}] ${message.toString().trim()}`);
        };

        proc.stdout.on('data', (data) => emit('info', data));

        proc.stderr.on('data', (data) => {
            const message = data.toString();
            if (isGitProgressCommand) {
                const lastLine = message.trim().split('\r').filter(Boolean).pop();
                if (lastLine) {
                    const progressRegex = /(Receiving|Resolving|Unpacking) objects:\s+(\d+)%/;
                    const match = lastLine.match(progressRegex);
                    if (match && socket) {
                        const stage = args.includes('clone') ? 'Cloning Repository' : 'Updating Repository';
                        const gitPercentage = parseInt(match[2], 10);
                        const overallPercentage = 70 + Math.round(gitPercentage * 0.3); 
                        socket.emit('setup:progress', { stage, percentage: overallPercentage, details: lastLine });
                        return;
                    }
                }
                emit('info', message.trim());
            } else if (!isCheck) {
                // For non-check commands, stderr is treated as an error.
                // We add a check to avoid logging benign warnings as errors.
                const lowerCaseMessage = message.toLowerCase();
                if (!lowerCaseMessage.includes('warning')) {
                    emit('error', message);
                } else {
                    emit('info', message); // Log warnings as info
                }
            }
        });

        proc.on('close', (code) => {
            if (code === 0) {
                 if (isGitProgressCommand && socket) {
                    const finalDetail = args.includes('clone') ? 'Clone successful.' : 'Update successful.';
                    socket.emit('setup:progress', { stage: 'Completed', percentage: 100, details: finalDetail });
                }
                resolve({ success: true, code });
            } else {
                const errorMsg = `Process exited with code ${code}`;
                if (!isCheck) {
                    emit('error', errorMsg);
                }
                reject(new Error(errorMsg));
            }
        });

        proc.on('error', (err) => {
            const errorMsg = `Failed to start subprocess: ${err.message}`;
            if (!isCheck) {
                emit('error', errorMsg);
            }
            reject(new Error(errorMsg));
        });
    });
};

app.get('/api/system-check', async (req, res) => {
    const checks = { git: false, docker: false, vscode: false, nix: false, dockerError: null, os: process.platform };
    try {
        await runCommand('git', ['--version'], { isCheck: true });
        checks.git = true;
    } catch (e) {}

    const codeCommand = isWindows ? 'where' : 'which';
    const codeArg = 'code';
    try {
        await runCommand(codeCommand, [codeArg], { isCheck: true });
        checks.vscode = true;
    } catch (e) {}
    

    if (!docker) {
        docker = await initializeDocker();
    }

    if (docker) {
        try {
            await docker.ping();
            checks.docker = true;
        } catch (e) {
            checks.docker = false;
            checks.dockerError = "Could not communicate with Docker Daemon. Please ensure Docker Desktop is running.";
            docker = null;
        }
    } else {
        checks.docker = false;
        checks.dockerError = "Server failed to connect to Docker. Please ensure Docker Desktop is running.";
    }

    // On Windows, Nix is not a direct dependency as it runs inside the Docker container.
    if (isWindows) {
        checks.nix = true;
    } else {
        try {
            await runCommand('nix', ['--version'], { isCheck: true });
            checks.nix = true;
        } catch (e) {}
    }

    res.json(checks);
});

app.post('/api/api-key', async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
    }
    try {
        writeConfig({ apiKey });
        res.json({ success: true });
    } catch (error) {
        console.error("Config file error:", error);
        res.status(500).json({ error: 'Failed to save API key to config file.' });
    }
});

app.get('/api/project-path', (req, res) => {
    res.json({ path: REPO_DIR_PATH });
});

// Return per-file patches for the last commit on a branch (branch~1..branch)
app.get('/api/task-diff', (req, res) => {
    const branch = req.query.branch;
    if (!branch || typeof branch !== 'string') return res.status(400).json({ error: 'branch is required' });
    try {
        const files = gitDiffFiles(branch, REPO_DIR_PATH);
        const patches = files.map(fp => ({ path: fp, patch: gitDiffPatchByFile(branch, fp, REPO_DIR_PATH) }));
        res.json({ branch, files: patches });
    } catch (e) {
        res.status(500).json({ error: 'Failed to compute diff' });
    }
});

// Stream a tar.gz of changed files in the last commit of a branch
app.get('/api/task-archive', (req, res) => {
    const branch = req.query.branch;
    if (!branch || typeof branch !== 'string') return res.status(400).json({ error: 'branch is required' });
    const files = gitDiffFiles(branch, REPO_DIR_PATH);
    if (!files.length) return res.status(404).json({ error: 'No changed files found' });
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="changes-${branch}.tar.gz"`);
    const pack = tar.pack(REPO_DIR_PATH, { entries: files });
    const gzip = zlib.createGzip();
    pack.pipe(gzip).pipe(res);
});

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('setup:check_repo_status', () => {
        const repoExists = fsSync.existsSync(path.join(REPO_DIR_PATH, '.git'));
        socket.emit('setup:repo_status', { repoExists });
    });

    socket.on('setup:start', async () => {
        const AGENT_HARBOR_REPO = 'https://github.com/blocksense-network/agent-harbor.git';
        try {
            const repoDirExists = fsSync.existsSync(REPO_DIR_PATH);
            const gitDirExists = fsSync.existsSync(path.join(REPO_DIR_PATH, '.git'));

            if (repoDirExists && !gitDirExists) {
                socket.emit('setup:log', { id: Date.now(), timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Found incomplete setup directory. Cleaning up...' });
                await fs.rm(REPO_DIR_PATH, { recursive: true, force: true });
                socket.emit('setup:log', { id: Date.now(), timestamp: new Date().toLocaleTimeString(), type: 'success', message: 'Cleanup complete.' });
            }

            if (fsSync.existsSync(path.join(REPO_DIR_PATH, '.git'))) {
                socket.emit('setup:log', { id: Date.now(), timestamp: new Date().toLocaleTimeString(), type: 'info', 'message': 'Existing Agent Harbor repository found. Checking for updates (fetch)...' });
                await runCommand('git', ['fetch', '--all'], { socket, eventName: 'setup:log', cwd: REPO_DIR_PATH });
            } else {
                 socket.emit('setup:log', { id: Date.now(), timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Cloning Agent Harbor repository...'});
                await runCommand('git', ['clone', '--progress', AGENT_HARBOR_REPO, REPO_DIR_NAME], { socket, eventName: 'setup:log', cwd: __dirname });
            }
            
            socket.emit('setup:complete');
        } catch (error) {
            socket.emit('setup:error', `Setup failed: ${error.message || 'Please check the logs.'}`);
        }
    });
    
    socket.on('task:create', async (details) => {
        const emitError = (message) => socket.emit('task:error', message);
        const emitLog = (message, type = 'info') => socket.emit('task:log', { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message, type });

        if (isWindows && !docker) {
            return emitError('Docker is not connected. Cannot create task on Windows.');
        }
        
        const { branchName, description, pushToRemote, agent } = details;
        const config = readConfig();
        const apiKey = config.apiKey;

        if (!apiKey && ['openhands', 'codex', 'goose'].includes(agent)) {
            return emitError('API Key not found. Please complete the API Key step.');
        }

        try {
            // STEP 1: Create the task definition (simulating agent-task functionality)
            emitLog(`Step 1/3: Creating task definition for agent '${agent}'...`);
            
            if (isWindows) {
                // Create task file and git operations
                const taskScript = `
set -e
cd /workspace
git config user.email 'wizard@blocksense.net'
git config user.name 'Agent Harbor Wizard'
git fetch --all || true
git checkout -B '${branchName}'
mkdir -p '.agents/tasks'
dirpath="$(dirname ".agents/tasks/${branchName}.md")"
mkdir -p "$dirpath"
printf '%s\n\n%s\n' '# Task: ${branchName}' '${description.replace(/'/g, `'\\''`)}' > ".agents/tasks/${branchName}.md"
git add ".agents/tasks/${branchName}.md"
if ! git diff --cached --quiet; then
  git commit -m "Task: ${branchName}"
else
  echo "No changes to commit for .agents/tasks/${branchName}.md"
fi
${pushToRemote ? 'git push -u origin ' + branchName : 'echo "Skip push"'}
`;
                await runCommand('docker', ['run', '--rm', '-v', `${REPO_DIR_PATH}:/workspace`, '-w', '/workspace', '--entrypoint', '/bin/sh', 'alpine/git:latest', '-c', taskScript], { socket, eventName: 'task:log' });
            } else {
                // Linux/macOS - direct git operations
                const taskDir = path.join(REPO_DIR_PATH, '.agents', 'tasks');
                await runCommand('mkdir', ['-p', taskDir], { cwd: REPO_DIR_PATH });
                const taskFile = path.join(taskDir, `${branchName}.md`);
                const taskContent = `# Task: ${branchName}\n\n${description}`;
                await fs.writeFile(taskFile, taskContent);
                
                await runCommand('git', ['config', 'user.email', 'wizard@blocksense.net'], { cwd: REPO_DIR_PATH });
                await runCommand('git', ['config', 'user.name', 'Agent Harbor Wizard'], { cwd: REPO_DIR_PATH });
                await runCommand('git', ['checkout', '-B', branchName], { cwd: REPO_DIR_PATH });
                await runCommand('git', ['add', taskFile], { cwd: REPO_DIR_PATH });
                try {
                    await runCommand('git', ['diff', '--cached', '--quiet'], { cwd: REPO_DIR_PATH, isCheck: true });
                    emitLog(`No changes to commit for ${taskFile}`);
                } catch (e) {
                    await runCommand('git', ['commit', '-m', `Task: ${branchName}`], { cwd: REPO_DIR_PATH });
                }
                if (pushToRemote) {
                    await runCommand('git', ['push', '-u', 'origin', branchName], { cwd: REPO_DIR_PATH });
                }
            }
            emitLog('Task definition created successfully.', 'success');

            // STEP 2: Get the task information (simulating get-task functionality)
            emitLog(`Step 2/3: Retrieving task information...`);
            
            if (isWindows) {
                const getTaskScript = `cat .agents/tasks/${branchName}.md || echo "Task file not found"`;
                await runCommand('docker', ['run', '--rm', '-v', `${REPO_DIR_PATH}:/workspace`, '-e', `LLM_API_KEY=${apiKey || ''}`, '-w', '/workspace', '--entrypoint', '/bin/sh', 'alpine/git:latest', '-c', getTaskScript], { socket, eventName: 'task:file_raw' });
            } else {
                const taskFile = path.join(REPO_DIR_PATH, '.agents', 'tasks', `${branchName}.md`);
                try {
                    const content = await fs.readFile(taskFile, 'utf-8');
                    socket.emit('task:file_raw', content);
                } catch (error) {
                    emitLog('Task file not found', 'error');
                }
            }

            // STEP 3: Execute the task using agent-specific method
            emitLog(`Step 3/3: Executing task with '${agent}' agent...`);
            
            if (agent === 'openhands') {
                // OpenHands: Run via Docker container
                if (isWindows) {
                    const openhandsImage = (config && config.openhandsImage) || 'ghcr.io/devopsi/openhands:latest';
                    try {
                        await runCommand('docker', ['run', '--rm', 
                            '-v', `${REPO_DIR_PATH}:/workspace`,
                            '-e', `LLM_API_KEY=${apiKey || ''}`,
                            openhandsImage,
                            'bash', '-c', './get-task && head -100 README.md || true'
                        ], { socket, eventName: 'task:log' });
                    } catch (e) {
                        emitLog('OpenHands image could not be pulled or executed. This step will be skipped. You may need Docker login or a different image. Set `openhandsImage` in server/config.json to override.', 'error');
                    }
                } else {
                    const openhandsImage = (config && config.openhandsImage) || 'ghcr.io/devopsi/openhands:latest';
                    try {
                        await runCommand('docker', ['run', '--rm',
                            '-v', `${REPO_DIR_PATH}:/workspace`,
                            '-e', `LLM_API_KEY=${apiKey || ''}`,
                            openhandsImage,
                            'bash', '-c', './get-task && head -100 README.md || true'
                        ], { socket, eventName: 'task:log' });
                    } catch (e) {
                        emitLog('OpenHands image could not be pulled or executed. This step will be skipped. Ensure Docker is running, login if needed, or set `openhandsImage` in server/config.json.', 'error');
                    }
                }
            } else if (agent === 'codex' || agent === 'jules' || agent === 'goose') {
                emitLog(`${agent} agent requires external setup. Please configure ${agent} environment and run the task manually.`, 'info');
                emitLog('Task definition has been created in Agent Harbor repository.', 'success');
            } else if (agent === 'copilot') {
                emitLog('GitHub Copilot agent requires GitHub CLI and manual setup. Task definition created.', 'info');
            }

            emitLog(`Task workflow completed for agent '${agent}'.`, 'success');
            socket.emit('task:complete');
        } catch(error) {
             emitError(`Task workflow failed: ${error.message || 'Check logs for details.'}`);
        }
    });

    // Prefetch OpenHands image on demand
    socket.on('agent:openhands:prefetch', async () => {
        const config = readConfig();
        const openhandsImage = (config && config.openhandsImage) || 'ghcr.io/all-hands-ai/openhands:latest';
        try {
            await runCommand('docker', ['pull', openhandsImage], { socket, eventName: 'setup:log' });
            socket.emit('setup:log', { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: `Pulled ${openhandsImage}`, type: 'success' });
        } catch (e) {
            socket.emit('setup:log', { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: `Failed to pull ${openhandsImage}: ${e.message || e}`, type: 'error' });
        }
    });

    // GitHub Auth: status check
    socket.on('auth:github:status', async () => {
        try {
            await runCommand('gh', ['auth', 'status', '--hostname', 'github.com'], { isCheck: true });
            socket.emit('auth:github:status', { authenticated: true, message: 'GitHub CLI is authenticated.' });
        } catch (e) {
            socket.emit('auth:github:status', { authenticated: false, message: 'GitHub CLI not authenticated or not installed.' });
        }
    });

    // GitHub Auth: interactive login via web
    socket.on('auth:github:login', async () => {
        try {
            await runCommand('gh', ['auth', 'login', '--hostname', 'github.com', '--web'], { socket, eventName: 'auth:log' });
            socket.emit('auth:github:status', { authenticated: true, message: 'GitHub login complete.' });
            socket.emit('auth:complete');
        } catch (e) {
            socket.emit('auth:error', e.message || 'GitHub login failed. Ensure GitHub CLI is installed.');
        }
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3001;

const startServer = () => {
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
};

(async () => {
    docker = await initializeDocker();
    startServer();
})();