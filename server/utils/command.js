const { spawn } = require('child_process');

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
                const lowerCaseMessage = message.toLowerCase();
                if (!lowerCaseMessage.includes('warning')) {
                    emit('error', message);
                } else {
                    emit('info', message);
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

module.exports = { runCommand };
