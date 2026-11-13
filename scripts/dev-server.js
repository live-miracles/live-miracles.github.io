// Builds the site, serves dist/ and rebuilds when anything the build reads
// changes (see inputPaths in build.js). The browser is not reloaded: refresh it
// after the "Rebuilt" line. GitHub responses are cached for the session (see
// BUILD_CACHE_DIR in build.js), so a rebuild takes about 2 s and does not touch
// the API rate limit; restart to fetch them again.

const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { inputPaths } = require('./build');

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

// Without a token GitHub allows 60 API requests an hour, which a few restarts use up
// (the build then warns "HTTP 403"). Use GITHUB_TOKEN when set, else the token of a
// logged-in GitHub CLI (`gh auth login`), else go without.
function findGithubToken() {
    if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
    try {
        const result = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8', timeout: 5000 });
        const token = result.status === 0 ? result.stdout.trim() : '';
        if (token) console.log('Using the GitHub CLI token for GitHub API requests.');
        return token;
    } catch {
        return '';
    }
}

let githubToken = '';

function build() {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, [path.join(__dirname, 'build.js')], {
            stdio: 'inherit',
            env: {
                ...process.env,
                BUILD_CACHE_DIR: cacheDir,
                // The preview always includes draft blog posts; `npm run build` does not.
                BLOG_DRAFTS: '1',
                ...(githubToken && { GITHUB_TOKEN: githubToken }),
            },
        });
        child.on('close', (code) => resolve(code === 0));
    });
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
    return inputPaths()
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
    githubToken = findGithubToken();
    if (!(await build())) {
        process.exitCode = 1;
        return;
    }
    const port = await findAvailablePort();
    // Run serve's JS entry with Node: spawning node_modules/.bin/serve.cmd fails with
    // EINVAL on Windows (Node 18.20+/20.12+ refuse .cmd files without a shell).
    const serveEntry = path.join(process.cwd(), 'node_modules', 'serve', 'build', 'main.js');
    const serve = spawn(
        process.execPath,
        [serveEntry, 'dist', '-l', String(port), '--no-port-switching'],
        { stdio: 'inherit' },
    );

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
