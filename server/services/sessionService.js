const crypto = require('crypto');

// In-memory storage for sessions (in a real app, this would be a DB)
const sessions = new Map();

/**
 * Create a new session
 * @param {string} taskId - Associated task ID
 * @param {object} metadata - Initial metadata
 */
const createSession = (taskId, metadata = {}) => {
    const sessionId = crypto.randomUUID();
    const session = {
        id: sessionId,
        taskId,
        createdAt: Date.now(),
        snapshots: [], // History of states
        metadata,
        parentId: null, // If forked
        parentSnapshotId: null
    };
    sessions.set(sessionId, session);
    return session;
};

/**
 * Add a snapshot to a session
 * @param {string} sessionId 
 * @param {object} state - State data (e.g., git commit hash, logs, etc.)
 */
const addSnapshot = (sessionId, state) => {
    const session = sessions.get(sessionId);
    if (!session) return null;

    const snapshot = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        state
    };
    session.snapshots.push(snapshot);
    return snapshot;
};

/**
 * Fork a session from a specific snapshot
 * @param {string} sessionId - Original session ID
 * @param {string} snapshotId - Snapshot ID to fork from
 */
const forkSession = (sessionId, snapshotId) => {
    const parentSession = sessions.get(sessionId);
    if (!parentSession) throw new Error('Session not found');

    const snapshotIndex = parentSession.snapshots.findIndex(s => s.id === snapshotId);
    if (snapshotIndex === -1) throw new Error('Snapshot not found');

    // Create new session linked to parent
    const newSessionId = crypto.randomUUID();
    const newSession = {
        id: newSessionId,
        taskId: crypto.randomUUID(), // New task ID for the fork
        createdAt: Date.now(),
        snapshots: [], // Start fresh or copy history? Usually start fresh from fork point
        metadata: {
            ...parentSession.metadata,
            forkedFrom: sessionId,
            forkedAtSnapshot: snapshotId
        },
        parentId: sessionId,
        parentSnapshotId: snapshotId
    };

    // Optionally copy relevant state from the snapshot to initialize the new task
    // For now, we just track the relationship

    sessions.set(newSessionId, newSession);
    return newSession;
};

/**
 * Get session details
 */
const getSession = (sessionId) => {
    return sessions.get(sessionId);
};

/**
 * Get all sessions
 */
const getAllSessions = () => {
    return Array.from(sessions.values());
};

/**
 * Export session transcript
 */
const exportTranscript = (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return null;

    let transcript = `Task ID: ${session.taskId}\n`;
    transcript += `Session ID: ${session.id}\n`;
    transcript += `Created At: ${new Date(session.createdAt).toLocaleString()}\n`;
    transcript += `Metadata: ${JSON.stringify(session.metadata, null, 2)}\n`;
    transcript += '-'.repeat(50) + '\n\n';

    session.snapshots.forEach(snap => {
        const time = new Date(snap.timestamp).toLocaleTimeString();
        if (snap.state.type === 'output') {
            transcript += `[${time}] ${snap.state.content}`;
        } else {
            transcript += `[${time}] [${snap.state.type}] ${JSON.stringify(snap.state)}\n`;
        }
    });

    return transcript;
};

module.exports = {
    createSession,
    addSnapshot,
    forkSession,
    getSession,
    getAllSessions,
    exportTranscript
};
