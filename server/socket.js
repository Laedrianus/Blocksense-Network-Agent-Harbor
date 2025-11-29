const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { runCommand } = require('./utils/command');
const { readConfig } = require('./utils/config');
const { runAhTask, launchTui, installAh, cancelTask, pauseTask, resumeTask } = require('./services/ahService');
const { createSession, addSnapshot, forkSession, getAllSessions, exportTranscript } = require('./services/sessionService');

const REPO_DIR_NAME = 'agent-harbor-temp';
const REPO_DIR_PATH = path.resolve(__dirname, '..', REPO_DIR_NAME);

const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected');

        // Setup Events
        socket.on('setup:check_repo_status', () => {
            const repoExists = fsSync.existsSync(path.join(REPO_DIR_PATH, '.git'));
            socket.emit('setup:repo_status', { repoExists });
        });

        socket.on('config:get', () => {
            const config = readConfig();
            socket.emit('config:data', config);
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
                    socket.emit('setup:log', { id: Date.now(), timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Cloning Agent Harbor repository...' });
                    await runCommand('git', ['clone', '--progress', AGENT_HARBOR_REPO, REPO_DIR_NAME], { socket, eventName: 'setup:log', cwd: path.join(__dirname, '..') });
                }

                socket.emit('setup:complete');
            } catch (error) {
                socket.emit('setup:error', `Setup failed: ${error.message || 'Please check the logs.'}`);
            }
        });

        // Task Creation
        socket.on('task:create', async (details) => {
            const emitError = (message) => socket.emit('task:error', message);
            const emitLog = (message, type = 'info') => socket.emit('task:log', { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message, type });

            const { agent } = details;
            const config = readConfig();
            const apiKeys = config.apiKeys || {};
            const agentApiKey = apiKeys[agent];

            // Check API key for agents that need it
            const agentsNeedingKey = ['claude', 'codex', 'gemini', 'cursor'];
            if (agentsNeedingKey.includes(agent) && !agentApiKey) {
                return emitError(`API Key for ${agent} not found. Please complete the API Key step for this specific agent.`);
            }

            try {
                emitLog(`Creating task with Agent Harbor CLI...`, 'info');

                // Use ah CLI to create task
                const result = await runAhTask(details, socket);

                if (result.success) {
                    emitLog('Task started successfully!', 'success');
                    socket.emit('task:started', { taskId: result.taskId });
                    // Note: task:complete will be emitted by the service when process ends
                } else {
                    emitError(`Task creation failed: ${result.error}`);
                }
            } catch (error) {
                emitError(`Task workflow failed: ${error.message || 'Check logs for details.'}`);
            }
        });

        // Task Control
        socket.on('task:cancel', (taskId) => {
            const success = cancelTask(taskId);
            if (success) {
                socket.emit('task:log', { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message: 'Task cancelled by user.', type: 'warning' });
                socket.emit('task:status', { taskId, status: 'cancelled' });
            }
        });

        socket.on('task:pause', (taskId) => {
            const success = pauseTask(taskId);
            if (success) {
                socket.emit('task:status', { taskId, status: 'paused' });
            }
        });

        socket.on('task:resume', (taskId) => {
            const success = resumeTask(taskId);
            if (success) {
                socket.emit('task:status', { taskId, status: 'running' });
            }
        });

        // Session Management
        socket.on('session:list', () => {
            socket.emit('session:list', getAllSessions());
        });

        socket.on('session:fork', ({ sessionId, snapshotId }) => {
            try {
                const newSession = forkSession(sessionId, snapshotId);
                socket.emit('session:forked', newSession);
            } catch (error) {
                socket.emit('error', error.message);
            }
        });

        socket.on('session:export', (sessionId) => {
            const transcript = exportTranscript(sessionId);
            if (transcript) {
                socket.emit('session:transcript', { sessionId, transcript });
            } else {
                socket.emit('error', 'Session not found');
            }
        });

        // Agent Harbor Installation
        socket.on('ah:install', async () => {
            const result = await installAh(socket);
            if (result.success) {
                socket.emit('ah:install:complete');
            } else {
                socket.emit('ah:install:error', result.error);
            }
        });

        // TUI Launch
        socket.on('tui:launch', async () => {
            const result = await launchTui(socket);
            if (result.success) {
                socket.emit('tui:complete');
            } else {
                socket.emit('tui:error', result.error);
            }
        });

        // Docker Prefetch
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

        // GitHub Auth
        socket.on('auth:github:status', async () => {
            try {
                await runCommand('gh', ['auth', 'status', '--hostname', 'github.com'], { isCheck: true });
                socket.emit('auth:github:status', { authenticated: true, message: 'GitHub CLI is authenticated.' });
            } catch {
                socket.emit('auth:github:status', { authenticated: false, message: 'GitHub CLI not authenticated or not installed.' });
            }
        });

        socket.on('auth:github:login', async () => {
            try {
                await runCommand('gh', ['auth', 'login', '--hostname', 'github.com', '--web'], { socket, eventName: 'auth:log' });
                socket.emit('auth:github:status', { authenticated: true, message: 'GitHub login complete.' });
                socket.emit('auth:complete');
            } catch (e) {
                socket.emit('auth:error', e.message || 'GitHub login failed. Ensure GitHub CLI is installed.');
            }
        });

        // Timeline Events
        const { listTasks, getTaskTimeline, rewindTimeline, forkTask } = require('./services/timelineService');

        socket.on('timeline:list', async () => {
            try {
                const tasks = await listTasks();
                socket.emit('timeline:tasks', { tasks });
            } catch (error) {
                socket.emit('timeline:error', { message: error.message });
            }
        });

        socket.on('timeline:get', async ({ taskId }) => {
            try {
                const timeline = await getTaskTimeline(taskId);
                socket.emit('timeline:data', { timeline });
            } catch (error) {
                socket.emit('timeline:error', { message: error.message });
            }
        });

        socket.on('timeline:rewind', async ({ taskId, snapshotId }) => {
            try {
                const result = await rewindTimeline(taskId, snapshotId);
                if (result.success) {
                    socket.emit('timeline:rewound', result);
                } else {
                    socket.emit('timeline:error', { message: result.error });
                }
            } catch (error) {
                socket.emit('timeline:error', { message: error.message });
            }
        });

        socket.on('timeline:fork', async ({ taskId, newBranch, prompt }) => {
            try {
                const result = await forkTask(taskId, newBranch, prompt);
                if (result.success) {
                    socket.emit('timeline:forked', result);
                } else {
                    socket.emit('timeline:error', { message: result.error });
                }
            } catch (error) {
                socket.emit('timeline:error', { message: error.message });
            }
        });

        // Parallel Tasks Events
        const MAX_PARALLEL_TASKS = 10;
        const activeTasks = new Map(); // Store active tasks

        socket.on('parallel:list', () => {
            const tasks = Array.from(activeTasks.values());
            socket.emit('parallel:tasks', { tasks });
        });

        socket.on('parallel:create:batch', async ({ tasks }) => {
            const emitError = (message) => socket.emit('parallel:error', { message });

            // Validate batch size
            if (!Array.isArray(tasks) || tasks.length === 0) {
                return emitError('No tasks provided');
            }

            const currentRunning = Array.from(activeTasks.values()).filter(t => t.status === 'running').length;
            if (currentRunning + tasks.length > MAX_PARALLEL_TASKS) {
                return emitError(`Cannot exceed ${MAX_PARALLEL_TASKS} concurrent tasks`);
            }

            // Create each task
            for (const taskConfig of tasks) {
                try {
                    const taskId = require('crypto').randomUUID();
                    const task = {
                        id: taskId,
                        branch: taskConfig.branchName,
                        agent: taskConfig.agent,
                        description: taskConfig.description,
                        status: 'running',
                        createdAt: Date.now(),
                        logs: []
                    };

                    // Add to active tasks
                    activeTasks.set(taskId, task);

                    // Emit task created
                    socket.emit('parallel:task:created', { task });

                    // Run task in background
                    runAhTask({
                        ...taskConfig,
                        taskId
                    }, {
                        // Custom socket emitter for parallel tasks
                        emit: (event, data) => {
                            if (event === 'task:log') {
                                socket.emit('parallel:task:log', { taskId, log: data });
                                // Update task logs
                                const t = activeTasks.get(taskId);
                                if (t) {
                                    t.logs.push(data);
                                }
                            } else if (event === 'task:status') {
                                const newStatus = data.status;
                                socket.emit('parallel:task:status', { taskId, status: newStatus });
                                // Update task status
                                const t = activeTasks.get(taskId);
                                if (t) {
                                    t.status = newStatus;
                                    if (newStatus === 'completed' || newStatus === 'failed' || newStatus === 'cancelled') {
                                        t.completedAt = Date.now();
                                    }
                                }
                            } else {
                                socket.emit(event, data);
                            }
                        }
                    }).catch(error => {
                        socket.emit('parallel:task:status', { taskId, status: 'failed' });
                        const t = activeTasks.get(taskId);
                        if (t) {
                            t.status = 'failed';
                            t.completedAt = Date.now();
                        }
                    });

                } catch (error) {
                    emitError(`Failed to create task: ${error.message}`);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};

module.exports = setupSocket;
