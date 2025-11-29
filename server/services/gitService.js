const { execSync } = require('child_process');


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

module.exports = { gitDiffFiles, gitDiffPatchByFile };
