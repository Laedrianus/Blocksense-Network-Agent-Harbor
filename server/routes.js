const express = require('express');
const path = require('path');
const zlib = require('zlib');
const tar = require('tar-fs');
const { runCommand } = require('./utils/command');
const { writeConfig } = require('./utils/config');
const { getDocker, initializeDocker } = require('./services/dockerService');
const { gitDiffFiles, gitDiffPatchByFile } = require('./services/gitService');
const { checkNixInstalled, checkAhInstalled } = require('./services/ahService');

const router = express.Router();
const isWindows = process.platform === 'win32';
const REPO_DIR_NAME = 'agent-harbor-temp';
const REPO_DIR_PATH = path.resolve(__dirname, REPO_DIR_NAME);

router.get('/system-check', async (req, res) => {
    const checks = { git: false, docker: false, vscode: false, nix: false, ah: false, dockerError: null, os: process.platform };
    try {
        await runCommand('git', ['--version'], { isCheck: true });
        checks.git = true;
    } catch {
        // ignore
    }

    const codeCommand = isWindows ? 'where' : 'which';
    const codeArg = 'code';
    try {
        await runCommand(codeCommand, [codeArg], { isCheck: true });
        checks.vscode = true;
    } catch {
        // ignore
    }

    let docker = getDocker();
    if (!docker) {
        docker = await initializeDocker();
    }

    if (docker) {
        try {
            await docker.ping();
            checks.docker = true;
        } catch {
            checks.docker = false;
            checks.dockerError = "Could not communicate with Docker Daemon. Please ensure Docker Desktop is running.";
        }
    } else {
        checks.docker = false;
        checks.dockerError = "Server failed to connect to Docker. Please ensure Docker Desktop is running.";
    }

    // Check Nix
    if (isWindows) {
        checks.nix = true; // Not required on Windows
    } else {
        checks.nix = await checkNixInstalled();
    }

    // Check ah CLI
    checks.ah = await checkAhInstalled();

    res.json(checks);
});

router.get('/api/config', (req, res) => {
    try {
        const config = require('./utils/config').readConfig();
        res.json(config);
    } catch (error) {
        console.error("Config read error:", error);
        res.status(500).json({ error: 'Failed to read config' });
    }
});

router.post('/api-key', async (req, res) => {
    const { apiKey, agent } = req.body;
    if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
    }
    if (!agent) {
        return res.status(400).json({ error: 'Agent name is required' });
    }
    try {
        const config = require('./utils/config').readConfig();
        // Store keys per agent in apiKeys object
        const apiKeys = config.apiKeys || {};
        apiKeys[agent] = apiKey;
        writeConfig({ ...config, apiKeys });
        res.json({ success: true });
    } catch (error) {
        console.error("Config file error:", error);
        res.status(500).json({ error: 'Failed to save API key to config file.' });
    }
});

router.get('/project-path', (req, res) => {
    res.json({ path: REPO_DIR_PATH });
});

router.get('/task-diff', (req, res) => {
    const branch = req.query.branch;
    if (!branch || typeof branch !== 'string') return res.status(400).json({ error: 'branch is required' });
    try {
        const files = gitDiffFiles(branch, REPO_DIR_PATH);
        const patches = files.map(fp => ({ path: fp, patch: gitDiffPatchByFile(branch, fp, REPO_DIR_PATH) }));
        res.json({ branch, files: patches });
    } catch {
        res.status(500).json({ error: 'Failed to compute diff' });
    }
});

router.get('/task-archive', (req, res) => {
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

module.exports = router;
