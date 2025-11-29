const { createSession, addSnapshot, forkSession, getSession, exportTranscript } = require('./sessionService');

describe('Session Service', () => {
    let session;

    beforeEach(() => {
        // Reset state if needed (though sessionService uses in-memory Map, so we might need a way to clear it or just create new sessions)
        session = createSession('task-123', { agent: 'test-agent' });
    });

    test('createSession creates a valid session', () => {
        expect(session).toHaveProperty('id');
        expect(session.taskId).toBe('task-123');
        expect(session.metadata.agent).toBe('test-agent');
        expect(session.snapshots).toEqual([]);
    });

    test('addSnapshot adds a snapshot to the session', () => {
        const snapshot = addSnapshot(session.id, { type: 'output', content: 'test output' });
        expect(snapshot).toHaveProperty('id');
        expect(snapshot.state.content).toBe('test output');

        const updatedSession = getSession(session.id);
        expect(updatedSession.snapshots).toHaveLength(1);
        expect(updatedSession.snapshots[0]).toEqual(snapshot);
    });

    test('forkSession creates a new session linked to the parent', () => {
        const snapshot = addSnapshot(session.id, { type: 'checkpoint', content: 'state 1' });
        const forkedSession = forkSession(session.id, snapshot.id);

        expect(forkedSession).toHaveProperty('id');
        expect(forkedSession.id).not.toBe(session.id);
        expect(forkedSession.parentId).toBe(session.id);
        expect(forkedSession.parentSnapshotId).toBe(snapshot.id);
        expect(forkedSession.metadata.forkedFrom).toBe(session.id);
    });

    test('exportTranscript generates a formatted string', () => {
        addSnapshot(session.id, { type: 'output', content: 'Hello World' });
        addSnapshot(session.id, { type: 'error', content: 'Something went wrong' });

        const transcript = exportTranscript(session.id);
        expect(transcript).toContain('Task ID: task-123');
        expect(transcript).toContain('Hello World');
        expect(transcript).toContain('Something went wrong');
    });

    test('forkSession throws error if session or snapshot not found', () => {
        expect(() => forkSession('invalid-id', 'snap-1')).toThrow('Session not found');
        expect(() => forkSession(session.id, 'invalid-snap')).toThrow('Snapshot not found');
    });
});
