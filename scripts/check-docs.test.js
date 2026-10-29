const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const script = path.join(__dirname, 'check-docs.js');

function project(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-docs-'));
    for (const [name, content] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
        fs.writeFileSync(path.join(dir, name), content);
    }
    execFileSync('git', ['-C', dir, 'init', '-q']);
    execFileSync('git', ['-C', dir, 'add', '-A']);
    return dir;
}

function check(dir) {
    try {
        return { code: 0, out: execFileSync('node', [script, dir], { encoding: 'utf8' }) };
    } catch (err) {
        return { code: err.status, out: err.stderr };
    }
}

test('accepts a project whose links, anchors and index are all valid', () => {
    const dir = project({
        'README.md':
            '# P\n\n[g](docs/1-a/1-g.md#setup) [t](#top) [ext](https://x.test/y.md)\n\n## Top\n',
        'docs/README.md': '# Docs\n[g](1-a/1-g.md)\n',
        'docs/1-a/1-g.md': '# G\n\n## Setup\n\n[up](../../README.md#top) [dir](../../docs/)\n',
    });
    const result = check(dir);
    assert.equal(result.code, 0, result.out);
});

test('reports a missing file, a bad anchor, a gitignored target, a missing image and an unindexed page', () => {
    const dir = project({
        'README.md':
            '# P\n\n[a](docs/1-a/1-g.md#nope) [b](docs/gone.md) [c](notes/x.md) [d](#absent)\n\n![i](img/gone.png)\n',
        '.gitignore': 'notes/\n',
        'notes/x.md': 'x\n',
        'docs/README.md': '# Docs\n[g](1-a/1-g.md)\n',
        'docs/1-a/1-g.md': '# G\n\n## Setup\n',
        'docs/1-a/2-orphan.md': '# Orphan\n',
    });
    const result = check(dir);
    assert.equal(result.code, 1);
    for (const expected of [
        'docs/1-a/1-g.md#nope) has no matching heading in docs/1-a/1-g.md',
        'docs/gone.md',
        'notes/x.md',
        '#absent) has no matching heading on this page',
        'img/gone.png',
        'docs/1-a/2-orphan.md is not linked from docs/README.md',
    ]) {
        assert.ok(result.out.includes(expected), `missing "${expected}" in:\n${result.out}`);
    }
});

test('ignores link-looking text in code spans and fenced blocks', () => {
    const dir = project({
        'README.md': '# P\n\n`[a](nope.md)`\n\n```\n[b](nope2.md)\n```\n',
    });
    const result = check(dir);
    assert.equal(result.code, 0, result.out);
});

test('accepts a folder link without a trailing slash and checks an anchor on a root link', () => {
    const ok = project({
        'README.md': '# P\n\n## Install\n',
        'docs/README.md': '# Docs\n[a](a.md)\n',
        'docs/a.md': '# A\n\n[docs](../docs) [root](../#install)\n',
    });
    assert.equal(check(ok).code, 0);

    const bad = project({
        'README.md': '# P\n\n## Install\n',
        'docs/README.md': '# Docs\n[a](a.md)\n',
        'docs/a.md': '# A\n\n[root](../#nothing)\n',
    });
    const result = check(bad);
    assert.equal(result.code, 1);
    assert.match(result.out, /no matching heading in README\.md/);
});
