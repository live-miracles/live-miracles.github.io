const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createProjectSource, parseLocalProjects } = require('./project-source');

const raw = 'https://raw.githubusercontent.com/org/p/master/';
const api = 'https://api.github.com/repos/org/p';

// A fetch that answers from a map of url -> body (or a status number), and
// records every call.
function fakeFetch(responses) {
    const calls = [];
    async function fetch(url) {
        calls.push(url);
        const answer = responses[url];
        if (answer === undefined) return new Response('', { status: 404 });
        if (typeof answer === 'number') return new Response('', { status: answer });
        return new Response(typeof answer === 'string' ? answer : JSON.stringify(answer));
    }
    return { fetch, calls };
}

function sourceFor(responses, options = {}) {
    const { fetch, calls } = fakeFetch(responses);
    return {
        calls,
        source: createProjectSource({ organization: 'org', branch: 'master', fetch, ...options }),
    };
}

const tree = (...paths) => ({ tree: paths.map((p) => ({ path: p })) });

test('load returns the repo, README, ordered docs and the docs index', async () => {
    const { source } = sourceFor({
        [api]: { stargazers_count: 3 },
        [`${raw}README.md`]: '# P',
        [`${api}/git/trees/master?recursive=1`]: tree(
            'README.md',
            'docs/README.md',
            'docs/10-ops/1-run.md',
            'docs/2-usage/1-start.md',
            'docs/intro.md',
            'src/index.js',
        ),
        [`${raw}docs/README.md`]: '# Docs',
        [`${raw}docs/10-ops/1-run.md`]: '# Run `it`',
        [`${raw}docs/2-usage/1-start.md`]: 'No title here',
        [`${raw}docs/intro.md`]: '# Intro',
    });
    const result = await source.load('p');
    assert.equal(result.repo.stargazers_count, 3);
    assert.equal(result.readme, '# P');
    assert.equal(result.docsIndex, '# Docs');
    assert.deepEqual(result.problems, []);
    assert.deepEqual(
        result.docs.map(({ repoPath, title, section, slug }) => ({
            repoPath,
            title,
            section,
            slug,
        })),
        [
            {
                repoPath: 'docs/2-usage/1-start.md',
                title: 'Start',
                section: 'Usage',
                slug: 'usage/start',
            },
            { repoPath: 'docs/10-ops/1-run.md', title: 'Run it', section: 'Ops', slug: 'ops/run' },
            { repoPath: 'docs/intro.md', title: 'Intro', section: null, slug: 'intro' },
        ],
    );
});

test('docs/adr and docs/agents are not published', async () => {
    const { source } = sourceFor({
        [`${api}/git/trees/master?recursive=1`]: tree(
            'docs/a.md',
            'docs/adr/0001-x.md',
            'docs/agents/domain.md',
            'docs/adrift.md',
        ),
        [`${raw}docs/a.md`]: '# A',
        [`${raw}docs/adrift.md`]: '# Adrift',
    });
    const { docs } = await source.load('p');
    assert.deepEqual(
        docs.map((doc) => doc.repoPath),
        ['docs/a.md', 'docs/adrift.md'],
    );
});

test('a missing docs/README.md is not a problem and is not retried', async () => {
    const { source, calls } = sourceFor({
        [api]: {},
        [`${raw}README.md`]: '# P',
        [`${api}/git/trees/master?recursive=1`]: tree('docs/a.md'),
        [`${raw}docs/a.md`]: '# A',
    });
    const result = await source.load('p');
    assert.equal(result.docsIndex, null);
    assert.deepEqual(result.problems, []);
    assert.equal(calls.filter((url) => url === `${raw}docs/README.md`).length, 1);
});

test('a part that fails is reported and the others still load', async () => {
    const { source, calls } = sourceFor({
        [api]: {},
        [`${raw}README.md`]: 503,
        [`${api}/git/trees/master?recursive=1`]: tree('docs/a.md'),
        [`${raw}docs/a.md`]: '# A',
        [`${raw}docs/README.md`]: 500,
    });
    const result = await source.load('p');
    assert.equal(result.readme, null);
    assert.equal(result.docs.length, 1);
    assert.equal(result.docsIndex, null);
    assert.deepEqual(
        result.problems.map((problem) => problem.part),
        ['README', 'docs index'],
    );
    assert.match(result.problems[0].message, /HTTP 503/);
    assert.equal(calls.filter((url) => url === `${raw}README.md`).length, 2);
});

test('a cache directory answers repeat requests without fetching again', async () => {
    const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'source-cache-'));
    const responses = {
        [api]: {},
        [`${raw}README.md`]: '# P',
        [`${api}/git/trees/master?recursive=1`]: tree(),
    };
    const first = sourceFor(responses, { cacheDir });
    await first.source.load('p');
    const second = sourceFor(responses, { cacheDir });
    const result = await second.source.load('p');
    assert.equal(result.readme, '# P');
    assert.equal(second.calls.length, 0);
});

test('a local checkout supplies the README and only the docs git tracks', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'source-local-'));
    const files = {
        'README.md': '# Local',
        'docs/README.md': '# Index',
        'docs/a.md': '# A',
        'docs/notes.md': '# Private',
        '.gitignore': 'docs/notes.md\n',
    };
    for (const [name, content] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
        fs.writeFileSync(path.join(dir, name), content);
    }
    execFileSync('git', ['-C', dir, 'init', '-q']);
    const { source, calls } = sourceFor({}, { localProjects: new Map([['p', dir]]) });
    const result = await source.load('p');
    assert.equal(result.readme, '# Local');
    assert.equal(result.docsIndex, '# Index');
    assert.deepEqual(
        result.docs.map((doc) => doc.repoPath),
        ['docs/a.md'],
    );
    assert.deepEqual(
        result.problems.map((problem) => problem.part),
        ['metadata'],
    );
    assert.equal(calls.filter((url) => url.startsWith(raw)).length, 0);
});

test('parseLocalProjects reads id=path pairs and keeps an = inside a path', () => {
    assert.deepEqual(
        [...parseLocalProjects('a=../a,b=/tmp/x=y')],
        [
            ['a', '../a'],
            ['b', '/tmp/x=y'],
        ],
    );
    assert.equal(parseLocalProjects(undefined).size, 0);
});
