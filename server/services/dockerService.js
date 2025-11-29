const Docker = require('dockerode');
const isWindows = process.platform === 'win32';

let docker = null;

const initializeDocker = async () => {
    try {
        if (isWindows) {
            const windowsSockets = [
                '//./pipe/dockerDesktopLinuxEngine',
                '//./pipe/docker_engine'
            ];
            for (const socketPath of windowsSockets) {
                try {
                    const testDocker = new Docker({ socketPath });
                    await testDocker.ping();
                    console.log(`Successfully connected to Docker at ${socketPath}`);
                    docker = testDocker;
                    return testDocker;
                } catch {
                    // console.log(`Failed to connect to Docker at ${socketPath}. Trying next...`);
                }
            }
            return null;
        } else {
            const socketPath = '/var/run/docker.sock';
            const linuxDocker = new Docker({ socketPath });
            await linuxDocker.ping();
            docker = linuxDocker;
            return linuxDocker;
        }
    } catch (error) {
        console.warn("An unexpected error occurred during Docker initialization.", error);
        return null;
    }
};

const getDocker = () => docker;

module.exports = { initializeDocker, getDocker };
