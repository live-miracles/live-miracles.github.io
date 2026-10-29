// Where a project's repository data comes from: the GitHub API and
// raw.githubusercontent.com at build time, or a local checkout for projects
// listed in LOCAL_PROJECTS (see build.js). `load(id)` returns the repository
// metadata, README and docs pages, and the problems that left a part empty, so
// callers never touch the network, the cache or the checkout themselves.
//
// A missing file (HTTP 404 or ENOENT) is an answer, not a failure: it is never
// retried and, for docs/README.md, not reported.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { stripTags } = require('./markdown-text');

// `id=path,id=path` into a Map. Splits at the first `=`, so a path may contain one.
function parseLocalProjects(value = '') {
    return new Map(
        value
            .split(',')
            .filter(Boolean)
            .map((entry) => {
                const at = entry.indexOf('=');
                return [entry.slice(0, at), entry.slice(at + 1)];
            }),
    );
}

function isNotFound(error) {
    return error.status === 404 || error.code === 'ENOENT';
}

// Number prefixes such as 1-getting-started order the docs and are dropped from names.
function stripOrder(name) {
    return name.replace(/\.md$/, '').replace(/^\d+-/, '');
}

function humanize(name) {
    const words = stripOrder(name).replace(/-/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
}

// `cacheDir` keeps each fetched response and reuses it. `fetch` can be replaced,
// which is how tests run without the network.
function createProjectSource({
    organization,
    branch,
    token,
    localProjects = new Map(),
    cacheDir,
    timeoutMs = 15000,
    fetch = globalThis.fetch,
}) {
    const apiHeaders = { Accept: 'application/vnd.github+json' };
    if (token) apiHeaders.Authorization = `Bearer ${token}`;

    async function request(url, options = {}) {
        let lastError;
        for (let attempt = 1; attempt <= 2; attempt += 1) {
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: AbortSignal.timeout(timeoutMs),
                });
                if (response.ok) return response;
                lastError = new Error(`${url}: HTTP ${response.status}`);
                lastError.status = response.status;
            } catch (error) {
                lastError = new Error(`${url}: ${error.message}`);
            }
            if (lastError.status === 404) break;
        }
        throw lastError;
    }

    // Only successful responses are cached, so a failed fetch is retried next build.
    async function cachedRequest(url, options) {
        if (!cacheDir) return request(url, options);
        const file = path.join(cacheDir, crypto.createHash('sha256').update(url).digest('hex'));
        if (fs.existsSync(file)) return new Response(fs.readFileSync(file));
        const body = Buffer.from(await (await request(url, options)).arrayBuffer());
        fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(file, body);
        return new Response(body);
    }

    async function readFile(id, repoPath) {
        const local = localProjects.get(id);
        if (local) return fs.readFileSync(path.join(local, repoPath), 'utf8');
        const response = await cachedRequest(
            `https://raw.githubusercontent.com/${organization}/${id}/${branch}/${repoPath}`,
        );
        return response.text();
    }

    async function readRepo(id) {
        const response = await cachedRequest(`https://api.github.com/repos/${organization}/${id}`, {
            headers: apiHeaders,
        });
        return response.json();
    }

    // Markdown files under docs/, as repository paths, in reading order. Local
    // checkouts list only files git would track, so gitignored notes are never
    // published.
    async function listDocs(id) {
        let paths;
        const local = localProjects.get(id);
        if (local) {
            paths = execFileSync(
                'git',
                ['-C', local, 'ls-files', '--cached', '--others', '--exclude-standard', 'docs'],
                { encoding: 'utf8' },
            ).split('\n');
        } else {
            const response = await cachedRequest(
                `https://api.github.com/repos/${organization}/${id}/git/trees/${branch}?recursive=1`,
                { headers: apiHeaders },
            );
            paths = (await response.json()).tree.map((entry) => entry.path);
        }
        return paths
            .filter((repoPath) => /^docs\/.+\.md$/.test(repoPath) && repoPath !== 'docs/README.md')
            .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    }

    async function readDocs(id) {
        const docs = [];
        for (const repoPath of await listDocs(id)) {
            const parts = repoPath.split('/').slice(1);
            const markdown = await readFile(id, repoPath);
            const title = markdown.match(/^# (.+)$/m)?.[1].trim() ?? humanize(parts.at(-1));
            docs.push({
                repoPath,
                markdown,
                title: stripTags(title.replace(/`/g, '')),
                section: parts.length > 1 ? humanize(parts[0]) : null,
                slug: parts.map(stripOrder).join('/'),
            });
        }
        return docs;
    }

    // { repo, readme, docs, docsIndex, problems }. Each part that cannot be read
    // is null or empty and listed in `problems` as { part, message }, so one
    // failure never stops the others.
    async function load(id) {
        const [repo, readme, docs] = await Promise.allSettled([
            readRepo(id),
            readFile(id, 'README.md'),
            readDocs(id),
        ]);
        const problems = [];
        for (const [part, result] of [
            ['metadata', repo],
            ['README', readme],
            ['docs', docs],
        ]) {
            if (result.status === 'rejected')
                problems.push({ part, message: result.reason.message });
        }
        const docList = docs.status === 'fulfilled' ? docs.value : [];

        let docsIndex = null;
        if (docList.length) {
            try {
                docsIndex = await readFile(id, 'docs/README.md');
            } catch (error) {
                // Without docs/README.md the index page lists the pages instead.
                if (!isNotFound(error))
                    problems.push({ part: 'docs index', message: error.message });
            }
        }
        return {
            repo: repo.status === 'fulfilled' ? repo.value : null,
            readme: readme.status === 'fulfilled' ? readme.value : null,
            docs: docList,
            docsIndex,
            problems,
        };
    }

    return { load };
}

module.exports = { createProjectSource, parseLocalProjects };
