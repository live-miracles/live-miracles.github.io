const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseFrontMatter, loadPosts, blogImageUrl, renderFeed } = require('./blog');

function post({ title = 'A title', date = '2026-01-02', draft = false, extra = '' } = {}) {
    return `---\ntitle: ${title}\ndate: ${date}\ntags: [one, two]\nsummary: A summary.\ndraft: ${draft}\n${extra}---\n\nBody.\n`;
}

function blogDir(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-test-'));
    for (const [name, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(dir, name), content);
    }
    return dir;
}

test('parseFrontMatter reads text, booleans and lists, and returns the body', () => {
    const { data, body } = parseFrontMatter(post({ title: 'Why: a colon' }));
    assert.equal(data.title, 'Why: a colon');
    assert.deepEqual(data.tags, ['one', 'two']);
    assert.equal(data.draft, false);
    assert.equal(body.trim(), 'Body.');
});

test('parseFrontMatter rejects a file without front matter or with a bad line', () => {
    assert.throws(() => parseFrontMatter('# Just markdown'), /missing front matter/);
    assert.throws(() => parseFrontMatter('---\nnot a pair\n---\n'), /cannot read/);
});

test('loadPosts returns published posts newest first and skips drafts and README', () => {
    const dir = blogDir({
        'README.md': '# Blog',
        '2026-01-02-older.md': post({ date: '2026-01-02' }),
        '2026-03-04-newer.md': post({ date: '2026-03-04' }),
        '2026-05-06-wip.md': post({ date: '2026-05-06', draft: true }),
    });
    const posts = loadPosts(dir);
    assert.deepEqual(
        posts.map((p) => p.slug),
        ['newer', 'older'],
    );
    assert.equal(posts[0].sourcePath, 'blog/2026-03-04-newer.md');
});

test('loadPosts includes drafts when asked to', () => {
    const dir = blogDir({
        '2026-01-02-live.md': post({ date: '2026-01-02' }),
        '2026-05-06-wip.md': post({ date: '2026-05-06', draft: true }),
    });
    assert.deepEqual(
        loadPosts(dir, { includeDrafts: true }).map((p) => p.slug),
        ['wip', 'live'],
    );
});

test('loadPosts skips a post with a missing field or a date that differs from its file name', () => {
    const warn = console.warn;
    const warnings = [];
    console.warn = (message) => warnings.push(message);
    try {
        const dir = blogDir({
            '2026-01-02-good.md': post({ date: '2026-01-02' }),
            '2026-02-02-wrong-date.md': post({ date: '2026-02-03' }),
            '2026-03-02-no-summary.md': '---\ntitle: T\ndate: 2026-03-02\n---\nBody\n',
        });
        assert.deepEqual(
            loadPosts(dir).map((p) => p.slug),
            ['good'],
        );
    } finally {
        console.warn = warn;
    }
    assert.equal(warnings.length, 2);
});

test('loadPosts reads the optional header image and serves it from /blog/', () => {
    const dir = blogDir({
        '2026-01-02-with.md': post({ extra: 'image: images/a.png\nimageAlt: A diagram\n' }),
        '2026-01-03-without.md': post({ date: '2026-01-03' }),
    });
    const [without, withImage] = loadPosts(dir);
    assert.equal(withImage.image, '/blog/images/a.png');
    assert.equal(withImage.imageAlt, 'A diagram');
    assert.equal(without.image, '');
    assert.equal(without.imageAlt, '');
});

test('loadPosts returns nothing when there is no blog folder', () => {
    assert.deepEqual(loadPosts(path.join(os.tmpdir(), 'no-such-blog-dir')), []);
});

test('blogImageUrl serves relative images from /blog/ and leaves other URLs alone', () => {
    assert.equal(blogImageUrl('images/a.png'), '/blog/images/a.png');
    assert.equal(blogImageUrl('./images/a.png'), '/blog/images/a.png');
    assert.equal(blogImageUrl('https://example.com/a.png'), 'https://example.com/a.png');
    assert.equal(blogImageUrl('/assets/logo.png'), '/assets/logo.png');
});

test('loadPosts renders each post: heading anchors, /blog/ images, links as written', () => {
    const body =
        '# Kept\n\n## Part one\n\n## Part one\n\n![shot](images/s.png "A shot") [x](docs/y.md)\n';
    const dir = blogDir({
        '2026-01-02-p.md': post().replace('Body.\n', body),
    });
    const [loaded] = loadPosts(dir);
    assert.equal(loaded.url, '/blog/p/');
    assert.match(loaded.html, /<h1 id="kept">Kept<\/h1>/);
    assert.match(loaded.html, /<h2 id="part-one">/);
    assert.match(loaded.html, /<h2 id="part-one-1">/);
    assert.match(loaded.html, /<img src="\/blog\/images\/s\.png" alt="shot" title="A shot"/);
    assert.match(loaded.html, /href="docs\/y\.md"/);
});

test('renderFeed lists posts with absolute links, RFC 822 dates and escaped text', () => {
    const dir = blogDir({
        '2026-01-02-one.md': post({ title: 'Fish & chips' }),
        '2026-03-04-two.md': post({ date: '2026-03-04' }),
    });
    const feed = renderFeed(loadPosts(dir), { siteUrl: 'https://x.test', siteName: 'Site' });
    assert.match(feed, /<title>Site blog<\/title>/);
    assert.match(feed, /<title>Fish &amp; chips<\/title>/);
    assert.match(feed, /<link>https:\/\/x\.test\/blog\/one\/<\/link>/);
    assert.match(feed, /<pubDate>Wed, 04 Mar 2026 00:00:00 GMT<\/pubDate>/);
    assert.ok(feed.indexOf('/blog/two/') < feed.indexOf('/blog/one/'));
});
