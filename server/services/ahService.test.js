const { runAhTask, cancelTask } = require('./ahService');
const { spawn } = require('child_process');
const { runCommand } = require('../utils/command');
const { createSession } = require('./sessionService');

// Mock dependencies
jest.mock('child_process');
jest.mock('../utils/command');
jest.mock('./sessionService');
jest.mock('./dockerService', () => ({
    getDocker: jest.fn()
}));

describe('AH Service', () => {
    let mockSocket;
    let mockChildProcess;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSocket = {
            emit: jest.fn()
        };

        mockChildProcess = {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn(),
            kill: jest.fn()
        };

        spawn.mockReturnValue(mockChildProcess);
        createSession.mockReturnValue({ id: 'session-123' });
        runCommand.mockResolvedValue({ success: true }); // Mock checkAhInstalled success
    });

    test('runAhTask starts a native process when ah is installed', async () => {
        // Setup runCommand to simulate ah installed
        runCommand.mockImplementation((cmd, args, opts) => {
            if (cmd === 'ah' && args[0] === '--version') return Promise.resolve();
            return Promise.resolve();
        });

        const details = {
            agent: 'claude',
            description: 'test task',
            branchName: 'feature/test',
            platform: 'windows' // Force native path
        };

        const result = await runAhTask(details, mockSocket);

        expect(result.success).toBe(true);
        expect(spawn).toHaveBeenCalledWith('ah', expect.arrayContaining(['task', '--agent', 'claude']), expect.any(Object));
        expect(mockSocket.emit).toHaveBeenCalledWith('task:log', expect.objectContaining({ type: 'info' }));
    });

    test('runAhTask falls back to Docker when ah is not installed or platform is linux', async () => {
        // Setup runCommand to simulate ah NOT installed
        runCommand.mockImplementation((cmd, args, opts) => {
            if (cmd === 'ah' && args[0] === '--version') return Promise.reject();
            return Promise.resolve();
        });

        const details = {
            agent: 'claude',
            description: 'test task',
            platform: 'linux'
        };

        // We need to mock getDocker to return something truthy
        const { getDocker } = require('./dockerService');
        getDocker.mockReturnValue({});

        const result = await runAhTask(details, mockSocket);

        expect(result.success).toBe(true);
        // Should NOT call spawn for 'ah' directly, but runCommand for 'docker'
        expect(spawn).not.toHaveBeenCalledWith('ah', expect.any(Array), expect.any(Object));
        expect(runCommand).toHaveBeenCalledWith('docker', expect.arrayContaining(['run']), expect.any(Object));
    });

    test('cancelTask kills the process', async () => {
        // First start a task to populate activeTasks
        runCommand.mockResolvedValue(); // Simulate ah installed
        const details = { agent: 'test', description: 'test', platform: 'windows' };
        const { taskId } = await runAhTask(details, mockSocket);

        const success = cancelTask(taskId);
        expect(success).toBe(true);
        expect(mockChildProcess.kill).toHaveBeenCalled();
    });
});
