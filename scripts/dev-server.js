// Builds the site, serves dist/ and rebuilds when the blog, the UI, the build
// scripts or a LOCAL_PROJECTS checkout's README and docs change. The browser is
// not reloaded: refresh it after the "Rebuilt" line. GitHub responses are cached
// for the session (see BUILD_CACHE_DIR in build.js), so a rebuild takes about 2 s
// and does not touch the API rate limit; restart to fetch them again.

const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

const firstPort = 3000;
const lastPort = 3010;
const pollMs = 1000;
const root = process.cwd();
const cacheDir = path.join(root, 'node_modules', '.cache', 'site-github');

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

function build() {
    return new Promise((resolve) => {
        const child = spawn('npm', ['run', 'build'], {
            stdio: 'inherit',
            env: { ...process.env, BUILD_CACHE_DIR: cacheDir },
        });
        child.on('close', (code) => resolve(code === 0));
    });
}

// Directories and files to watch. A LOCAL_PROJECTS checkout contributes its
// README and docs/, which build.js reads from disk.
function watchTargets() {
    const targets = ['blog', 'ui', 'scripts'].map((name) => path.join(root, name));
    for (const entry of (process.env.LOCAL_PROJECTS ?? '').split(',').filter(Boolean)) {
        const local = entry.split('=')[1];
        targets.push(path.resolve(local, 'docs'), path.resolve(local, 'README.md'));
    }
    return targets;
}

function listFiles(target, files = []) {
    let stat;
    try {
        stat = fs.statSync(target);
    } catch {
        return files;
    }
    if (!stat.isDirectory()) {
        files.push(`${target}:${stat.mtimeMs}:${stat.size}`);
        return files;
    }
    for (const name of fs.readdirSync(target)) {
        if (!name.endsWith('.test.js')) listFiles(path.join(target, name), files);
    }
    return files;
}

// A signature of every watched file's path, mtime and size. Polling it catches
// editors that save by replacing the file, which fs.watch loses track of, and
// added or deleted files.
function snapshot() {
    return watchTargets()
        .flatMap((target) => listFiles(target))
        .join('\n');
}

function watchAndRebuild() {
    let seen = snapshot();
    let building = false;

    setInterval(async () => {
        const current = snapshot();
        if (building || current === seen) return;
        seen = current;
        building = true;
        const started = Date.now();
        const ok = await build();
        building = false;
        const seconds = ((Date.now() - started) / 1000).toFixed(1);
        console.log(
            ok
                ? `Rebuilt in ${seconds} s. Refresh the browser.`
                : 'Build failed, still serving the last output.',
        );
    }, pollMs);
}

async function start() {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    if (!(await build())) {
        process.exitCode = 1;
        return;
    }
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
        process.exit();
    });
    watchAndRebuild();
}

start().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
