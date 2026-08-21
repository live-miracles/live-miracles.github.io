const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

const firstPort = 3000;
const lastPort = 3010;

function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once('error', () => resolve(false));
        server.once('listening', () => server.close(() => resolve(true)));
        server.listen(port, '0.0.0.0');
    });
}

async function findAvailablePort() {
    for (let port = firstPort; port <= lastPort; port += 1) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }

    throw new Error(`No available development port between ${firstPort} and ${lastPort}.`);
}

async function start() {
    const port = await findAvailablePort();
    const serveCommand = path.join(
        process.cwd(),
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'serve.cmd' : 'serve',
    );
    const serve = spawn(serveCommand, ['dist', '-l', String(port), '--no-port-switching'], {
        stdio: 'inherit',
    });

    serve.on('close', (code, signal) => {
        process.exitCode = code ?? (signal ? 1 : 0);
    });
}

start().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
