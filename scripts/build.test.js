const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { sitePages, sitemap } = require('./build');

const data = [
    {
        project: { id: 'one' },
        repo: { pushed_at: '2026-02-03T10:00:00Z' },
        docs: [{ url: '/projects/one/docs/a/' }, { url: '/projects/one/docs/b/' }],
    },
    { project: { id: 'two' }, repo: null, docs: [] },
];
const posts = [
    { url: '/blog/newer/', date: '2026-04-05' },
    { url: '/blog/older/', date: '2026-01-02' },
];

test('sitePages lists the home page, blog, posts, projects and docs pages once each', () => {
    assert.deepEqual(
        sitePages(data, posts).map((page) => page.url),
        [
            '/',
            '/blog/',
            '/blog/newer/',
            '/blog/older/',
            '/projects/one/',
            '/projects/one/docs/',
            '/projects/one/docs/a/',
            '/projects/one/docs/b/',
            '/projects/two/',
        ],
    );
});

test('sitePages dates pages by post date, repository push or today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const lastmod = Object.fromEntries(sitePages(data, posts).map((p) => [p.url, p.lastmod]));
    assert.equal(lastmod['/blog/'], '2026-04-05');
    assert.equal(lastmod['/blog/older/'], '2026-01-02');
    assert.equal(lastmod['/projects/one/docs/a/'], '2026-02-03');
    assert.equal(lastmod['/projects/two/'], today);
    assert.equal(lastmod['/'], today);
});

test('the sitemap has an entry for every page', () => {
    const pages = sitePages(data, posts);
    const xml = sitemap(pages);
    for (const page of pages)
        assert.ok(xml.includes(`<loc>https://live-miracles.github.io${page.url}</loc>`));
    assert.equal(xml.match(/<url>/g).length, pages.length);
});

// inputPaths reads LOCAL_PROJECTS when build.js loads, so ask a fresh process.
function inputPathsWith(env) {
    const script = "console.log(JSON.stringify(require('./build').inputPaths()))";
    const out = execFileSync(process.execPath, ['-e', script], {
        cwd: __dirname,
        env: { ...process.env, LOCAL_PROJECTS: '', ...env },
        encoding: 'utf8',
    });
    return JSON.parse(out);
}

test('inputPaths lists what the build reads, and the README and docs of local projects', () => {
    const root = path.join(__dirname, '..');
    assert.deepEqual(
        inputPathsWith({}),
        ['blog', 'ui', 'scripts'].map((n) => path.join(root, n)),
    );
    assert.deepEqual(inputPathsWith({ LOCAL_PROJECTS: 'a=/tmp/a,b=/tmp/b' }).slice(3), [
        path.resolve('/tmp/a/docs'),
        path.resolve('/tmp/a/README.md'),
        path.resolve('/tmp/b/docs'),
        path.resolve('/tmp/b/README.md'),
    ]);
});
