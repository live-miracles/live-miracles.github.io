const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    parseMarkdownPage,
    linkResolver,
    resolveRepoLink,
    isRelativeLink,
    absoluteUrl,
} = require('./markdown-page');

test('the first level-1 heading is the title and has no anchor; repeated headings get suffixes', () => {
    const page = parseMarkdownPage('# Title\n\n## Setup\n\n### Setup\n\n## Setup\n\n# Second h1\n');
    assert.deepEqual([...page.slugs], ['setup', 'setup-1', 'setup-2', 'second-h1']);
    assert.deepEqual(
        page.toc.map(({ slug, level, label }) => ({ slug, level, label })),
        [
            { slug: 'setup', level: 2, label: 'Setup' },
            { slug: 'setup-1', level: 3, label: 'Setup' },
            { slug: 'setup-2', level: 2, label: 'Setup' },
        ],
    );
    assert.doesNotMatch(page.html, /Title/);
});

test('links lists links, images and raw HTML src/href as written, before any rewriting', () => {
    const page = parseMarkdownPage(
        '[a](docs/a.md) ![shot](img/s.png)\n\n<img src="img/raw.png"> <a href="b.md">b</a>\n',
        { rewriteLink: () => 'REWRITTEN', rewriteImage: () => 'https://x.test/img.png' },
    );
    assert.deepEqual(
        page.links.map((link) => link.href),
        ['docs/a.md', 'img/s.png', 'img/raw.png', 'b.md'],
    );
    assert.match(page.html, /href="REWRITTEN"/);
    assert.match(page.html, /src="https:\/\/x\.test\/img\.png"/);
});

test('ogImage is the first https image that is not a badge or an SVG', () => {
    const page = parseMarkdownPage(
        '![b](https://img.shields.io/x.svg) ![l](https://x.test/logo.svg) ![r](rel.png) ![s](https://x.test/shot.png)',
    );
    assert.equal(page.ogImage, 'https://x.test/shot.png');
    assert.equal(parseMarkdownPage('text').ogImage, undefined);
});

test('resolveRepoLink resolves against the page and names the folder README', () => {
    assert.deepEqual(resolveRepoLink('docs/a/b.md', '../c.md#top'), {
        target: 'docs/c.md',
        hash: '#top',
        folderReadme: 'docs/c.md/README.md',
    });
    assert.equal(resolveRepoLink('docs/a.md', '../docs').folderReadme, 'docs/README.md');
    assert.equal(resolveRepoLink('docs/a.md', '../docs/').folderReadme, 'docs/README.md');
    assert.equal(resolveRepoLink('docs/a.md', '../').folderReadme, 'README.md');
});

test('isRelativeLink and absoluteUrl leave URLs and empty values alone', () => {
    assert.equal(isRelativeLink('a.md'), true);
    assert.equal(isRelativeLink('#top'), true);
    assert.equal(isRelativeLink('https://x.test'), false);
    assert.equal(isRelativeLink('//x.test'), false);
    assert.equal(isRelativeLink(''), false);
    assert.equal(absoluteUrl('s.png', 'https://x.test/a/b.md'), 'https://x.test/a/s.png');
    assert.equal(absoluteUrl('#top', 'https://x.test/a/b.md'), '#top');
    assert.equal(absoluteUrl('https://y.test/s.png', 'https://x.test/'), 'https://y.test/s.png');
});

test('linkResolver sends README and docs links to site pages and the rest to GitHub', () => {
    const siteUrls = new Map([
        ['README.md', '/projects/p/'],
        ['docs/README.md', '/projects/p/docs/'],
        ['docs/a.md', '/projects/p/docs/a/'],
    ]);
    const resolve = linkResolver({
        blobBase: 'https://github.com/org/p/blob/master/',
        repoPath: 'docs/b.md',
        siteUrls,
    });
    assert.equal(resolve('a.md#x'), '/projects/p/docs/a/#x');
    assert.equal(resolve('../README.md'), '/projects/p/');
    assert.equal(resolve('#top'), '#top');
    assert.equal(resolve('https://x.test/y'), 'https://x.test/y');
    assert.equal(resolve('../src/index.js'), 'https://github.com/org/p/blob/master/src/index.js');
});

test('linkResolver maps a folder link to its README page with or without a trailing slash', () => {
    const siteUrls = new Map([
        ['README.md', '/projects/p/'],
        ['docs/README.md', '/projects/p/docs/'],
    ]);
    const resolve = linkResolver({
        blobBase: 'https://github.com/org/p/blob/master/',
        repoPath: 'docs/a.md',
        siteUrls,
    });
    assert.equal(resolve('../docs'), '/projects/p/docs/');
    assert.equal(resolve('../docs/'), '/projects/p/docs/');
    assert.equal(resolve('../'), '/projects/p/');
});
