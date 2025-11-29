const { runCommand } = require('../utils/command');
const path = require('path');
const { getDocker } = require('./dockerService');
const { spawn } = require('child_process');
const crypto = require('crypto');
const { createSession, addSnapshot } = require('./sessionService');

const activeTasks = new Map();

const REPO_DIR_NAME = 'agent-harbor-temp';
const REPO_DIR_PATH = path.resolve(__dirname, '..', REPO_DIR_NAME);

/**
 * Check if ah CLI is installed
 */
const checkAhInstalled = async () => {
    try {
        await runCommand('ah', ['--version'], { isCheck: true });
        return true;
    } catch {
        return false;
    }
};

/**
 * Check if Nix is installed
 */
const checkNixInstalled = async () => {
    try {
        await runCommand('nix', ['--version'], { isCheck: true });
        return true;
    } catch {
        return false;
    }
};

/**
 * Install ah CLI via Nix
 */
const installAh = async (socket) => {
    const emitLog = (message, type = 'info') => {
        if (socket) {
            socket.emit('ah:install:log', {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                message,
                type
            });
        }
    };

    try {
        emitLog('Installing Agent Harbor via Nix...', 'info');
        await runCommand('nix', ['profile', 'install', 'github:blocksense-network/agent-harbor'], {
            socket,
            eventName: 'ah:install:log'
        });
        emitLog('Agent Harbor installed successfully!', 'success');
        return { success: true };
    } catch (error) {
        emitLog(`Installation failed: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
};

/**
 * Run ah task command (with Docker fallback and monitoring)
 */
const runAhTask = async (details, socket) => {
    const { branchName, description, agent, platform = 'linux' } = details;
    const taskId = crypto.randomUUID();

    // Create session for this task
    const session = createSession(taskId, { ...details, type: 'ah-task' });

    const emitLog = (message, type = 'info') => {
        if (socket) {
            socket.emit('task:log', {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                message,
                type,
                taskId // Include taskId in logs
            });
        }
    };

    const emitOutput = (output) => {
        const outStr = output.toString();
        addSnapshot(session.id, { type: 'output', content: outStr });

        if (socket) {
            socket.emit('task:output', {
                taskId,
                output: outStr,
                timestamp: Date.now()
            });
        }
    };

    try {
        // Determine execution mode based on platform
        // Default to Docker (Linux) if not specified or if explicitly requested
        // Use Native if 'windows' requested AND we are on Windows (implied by native check)

        let useNative = false;
        if (platform === 'windows') {
            const ahAvailable = await checkAhInstalled();
            if (ahAvailable) {
                useNative = true;
            } else {
                emitLog('Requested Windows platform but ah CLI not found natively. Falling back to Docker (Linux)...', 'warning');
                // Fallback to Docker
            }
        }

        if (useNative) {
            // Use native ah CLI
            emitLog(`Creating task with native ah CLI (Windows)...`, 'info');

            const args = [
                'task',
                '--agent', agent,
                '--prompt', description
            ];

            if (branchName) {
                args.push('--branch', branchName);
            }

            if (details.yoloMode) {
                args.push('--auto-approve');
            }

            // Use spawn for real-time monitoring
            const child = spawn('ah', args, { cwd: REPO_DIR_PATH, shell: true });

            // Store active task
            activeTasks.set(taskId, child);

            child.stdout.on('data', (data) => {
                emitOutput(data);
            });

            child.stderr.on('data', (data) => {
                emitOutput(data);
            });

            child.on('close', (code) => {
                activeTasks.delete(taskId);
                if (code === 0) {
                    emitLog('Task completed successfully!', 'success');
                    socket.emit('task:status', { taskId, status: 'completed' });
                } else if (code !== null) {
                    emitLog(`Task failed with code ${code}`, 'error');
                    socket.emit('task:status', { taskId, status: 'failed' });
                }
            });

            child.on('error', (err) => {
                activeTasks.delete(taskId);
                emitLog(`Task process error: ${err.message}`, 'error');
                socket.emit('task:status', { taskId, status: 'failed' });
            });

            return { success: true, taskId };

        } else {
            // Fallback to Docker-based Nix + ah
            emitLog(`Native ah CLI not found. Using Docker-based Nix environment...`, 'info');

            const docker = getDocker();
            if (!docker) {
                throw new Error('Docker is not available. Please install Docker or Nix.');
            }

            // Use nixos/nix Docker image to run ah CLI
            const nixImage = 'nixos/nix:latest';

            // Pull Nix image if not available
            emitLog('Pulling Nix Docker image...', 'info');
            await runCommand('docker', ['pull', nixImage], { socket, eventName: 'task:log' });

            // Install ah CLI in container and run task
            const ahCommand = `
                nix --extra-experimental-features 'nix-command flakes' profile install github:blocksense-network/agent-harbor && \\
                ah task --agent ${agent} --prompt "${description.replace(/"/g, '\\"')}" ${branchName ? `--branch ${branchName}` : ''} ${details.yoloMode ? '--auto-approve' : ''}
            `;

            emitLog('Running ah task in Docker container...', 'info');

            // For Docker, we use runCommand but we should try to capture output if possible.
            // runCommand uses spawn internally but doesn't expose the child process easily for activeTasks map.
            // For now, we'll just await it. Parallelism might be limited here unless we refactor runCommand.
            // TODO: Refactor Docker execution to support true parallelism and cancellation.

            // We'll simulate a task ID for Docker tasks too, but cancellation won't work yet.
            socket.emit('task:status', { taskId, status: 'running' });

            await runCommand('docker', [
                'run', '--rm',
                '-v', `${REPO_DIR_PATH}:/workspace`,
                '-w', '/workspace',
                nixImage,
                'sh', '-c', ahCommand
            ], { socket, eventName: 'task:log' });

            emitLog('Task created successfully via Docker!', 'success');
            socket.emit('task:status', { taskId, status: 'completed' });
            return { success: true, taskId };
        }
    } catch (error) {
        emitLog(`Task creation failed: ${error.message}`, 'error');
        socket.emit('task:status', { taskId, status: 'failed' });
        return { success: false, error: error.message };
    }
};

/**
 * Launch ah TUI
 */
const launchTui = async (socket) => {
    const emitLog = (message, type = 'info') => {
        if (socket) {
            socket.emit('tui:log', {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                message,
                type
            });
        }
    };

    try {
        emitLog('Launching Agent Harbor TUI...', 'info');

        // Launch TUI in background
        await runCommand('ah', ['tui'], {
            socket,
            eventName: 'tui:log',
            cwd: REPO_DIR_PATH
        });

        emitLog('TUI launched successfully!', 'success');
        return { success: true };
    } catch (error) {
        emitLog(`TUI launch failed: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
};

/**
 * Cancel a running task
 */
const cancelTask = (taskId) => {
    const child = activeTasks.get(taskId);
    if (child) {
        child.kill(); // Sends SIGTERM
        activeTasks.delete(taskId);
        return true;
    }
    return false;
};

/**
 * Pause a running task
 */
const pauseTask = (taskId) => {
    const child = activeTasks.get(taskId);
    if (child) {
        try {
            child.kill('SIGSTOP');
            return true;
        } catch (e) {
            console.error('Failed to pause task:', e);
            return false;
        }
    }
    return false;
};

/**
 * Resume a paused task
 */
const resumeTask = (taskId) => {
    const child = activeTasks.get(taskId);
    if (child) {
        try {
            child.kill('SIGCONT');
            return true;
        } catch (e) {
            console.error('Failed to resume task:', e);
            return false;
        }
    }
    return false;
};

module.exports = {
    checkAhInstalled,
    checkNixInstalled,
    installAh,
    runAhTask,
    launchTui,
    cancelTask,
    pauseTask,
    resumeTask
};
