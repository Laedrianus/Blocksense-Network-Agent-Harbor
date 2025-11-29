const request = require('supertest');
const express = require('express');
const routes = require('../routes');
const { initializeDocker } = require('../services/dockerService');

// Mock dependencies
jest.mock('../services/dockerService');
jest.mock('../utils/command', () => ({
    runCommand: jest.fn().mockResolvedValue({ success: true })
}));
jest.mock('../utils/config', () => ({
    readConfig: jest.fn().mockReturnValue({ apiKey: 'test-key' }),
    writeConfig: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Server API Endpoints', () => {
    beforeAll(() => {
        // Mock docker implementation
        initializeDocker.mockResolvedValue({ ping: jest.fn().mockResolvedValue(true) });
    });

    test('GET /api/system-check returns status', async () => {
        const res = await request(app).get('/api/system-check');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('git');
        expect(res.body).toHaveProperty('docker');
    });

    test('POST /api/api-key saves key', async () => {
        const res = await request(app).post('/api/api-key').send({ apiKey: 'new-key' });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('GET /api/project-path returns path', async () => {
        const res = await request(app).get('/api/project-path');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('path');
    });
});
