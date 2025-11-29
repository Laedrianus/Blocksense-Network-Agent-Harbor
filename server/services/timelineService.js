const { runCommand } = require('../utils/command');
const path = require('path');

const REPO_DIR_PATH = path.resolve(__dirname, '../agent-harbor-temp');

/**
 * List all tasks from Agent Harbor
 * Calls: ah task list --format json
 */
async function listTasks() {
    try {
        const result = await runCommand('ah', ['task', 'list', '--format', 'json'], {
            cwd: REPO_DIR_PATH,
            isCheck: false
        });

        // Parse JSON output
        if (result && result.trim()) {
            return JSON.parse(result);
        }
        return [];
    } catch (error) {
        console.error('Failed to list tasks:', error);
        // If ah command fails, return empty array
        return [];
    }
}

/**
 * Get timeline/snapshots for a specific task
 * Calls: ah timeline show <taskId>
 */
async function getTaskTimeline(taskId) {
    try {
        const result = await runCommand('ah', ['timeline', 'show', taskId], {
            cwd: REPO_DIR_PATH,
            isCheck: false
        });

        // Parse output (format depends on ah CLI output)
        // For now, return raw output
        return {
            taskId,
            snapshots: parseTimeline(result),
            raw: result
        };
    } catch (error) {
        console.error(`Failed to get timeline for task ${taskId}:`, error);
        return {
            taskId,
            snapshots: [],
            error: error.message
        };
    }
}

/**
 * Rewind timeline to a specific snapshot
 * Calls: ah timeline rewind <snapshotId>
 */
async function rewindTimeline(taskId, snapshotId) {
    try {
        const result = await runCommand('ah', ['timeline', 'rewind', snapshotId], {
            cwd: REPO_DIR_PATH,
            isCheck: false
        });

        return {
            success: true,
            taskId,
            snapshotId,
            message: result
        };
    } catch (error) {
        console.error(`Failed to rewind timeline for task ${taskId}:`, error);
        return {
            success: false,
            taskId,
            snapshotId,
            error: error.message
        };
    }
}

/**
 * Fork a task from a specific point
 * Calls: ah fork <taskId> --branch <newBranch> --prompt "<prompt>"
 */
async function forkTask(taskId, newBranch, prompt) {
    try {
        const args = ['fork', taskId];
        if (newBranch) {
            args.push('--branch', newBranch);
        }
        if (prompt) {
            args.push('--prompt', prompt);
        }

        const result = await runCommand('ah', args, {
            cwd: REPO_DIR_PATH,
            isCheck: false
        });

        return {
            success: true,
            parentTaskId: taskId,
            newBranch,
            message: result
        };
    } catch (error) {
        console.error(`Failed to fork task ${taskId}:`, error);
        return {
            success: false,
            parentTaskId: taskId,
            error: error.message
        };
    }
}

/**
 * Parse timeline output from ah CLI
 * This is a helper function that may need adjustment based on actual output format
 */
function parseTimeline(rawOutput) {
    if (!rawOutput || !rawOutput.trim()) {
        return [];
    }

    // Try to parse as JSON first
    try {
        return JSON.parse(rawOutput);
    } catch {
        // If not JSON, parse as text
        // This is a placeholder - adjust based on actual ah timeline output
        const lines = rawOutput.split('\n').filter(line => line.trim());
        return lines.map((line, index) => ({
            id: index,
            timestamp: Date.now() - (index * 60000), // Mock timestamp
            message: line
        }));
    }
}

module.exports = {
    listTasks,
    getTaskTimeline,
    rewindTimeline,
    forkTask
};
