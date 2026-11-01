const test = require('node:test');
const assert = require('node:assert/strict');
const { exportMarkdown } = require('./blog-markdown');

const site = 'https://live-miracles.github.io';
const examplePost = {
    url: '/blog/example/',
    title: 'An example post',
    summary: 'A short description.',
    tags: ['srt', 'bonding', 'goryu', 'mediamtx'],
};
const exportBody = (markdown) => exportMarkdown({ ...examplePost, markdown }, site);

test('Markdown export resolves images from blog/ and links from the article URL', () => {
    const copied = exportBody(
        '![shot](images/a.webp "A shot")\n\n[project](/projects/gallery/) [part](#part) [next](../next/)',
    );
    assert.ok(copied.includes('![shot](<' + site + '/blog/images/a.webp> "A shot")'));
    assert.ok(copied.includes('<' + site + '/projects/gallery/>'));
    assert.ok(copied.includes('<' + site + '/blog/example/#part>'));
    assert.ok(copied.includes('<' + site + '/blog/next/>'));
});

test('Markdown export preserves code examples and rewrites reference images and raw HTML', () => {
    const tick = String.fromCharCode(96);
    const code =
        tick +
        '![example](images/a.webp)' +
        tick +
        '\n\n' +
        tick.repeat(3) +
        'md\n![example](images/a.webp)\n' +
        tick.repeat(3);
    const copied = exportBody(
        code + '\n\n![real][shot]\n\n[shot]: ./images/a.webp\n\n<img src="images/b.webp" alt="B">',
    );
    assert.ok(copied.includes(code));
    assert.ok(copied.includes('![real](<' + site + '/blog/images/a.webp>)'));
    assert.ok(copied.includes('<img src="' + site + '/blog/images/b.webp" alt="B">'));
});

test('Markdown export handles linked images, lists, quotes and table cells', () => {
    const copied = exportBody(
        '- [![shot](images/a.webp)](/projects/gallery/)\n\n> ![quote](images/b.webp)\n\n| Image |\n| --- |\n| ![cell](images/c.webp) |',
    );
    for (const file of ['a', 'b', 'c'])
        assert.ok(copied.includes(site + '/blog/images/' + file + '.webp'));
    assert.ok(copied.includes(site + '/projects/gallery/'));
    assert.ok(copied.includes('> ![quote]'));
});

test('Markdown export preserves external links, autolinks and email addresses', () => {
    const body =
        '[external](https://example.com/a "Title")\n\n<https://example.com/b> and person@example.com';
    assert.equal(exportBody(body).split('---\n\n')[1], body + '\n');
});

test('article page safely embeds Markdown alongside the copy control', () => {
    const { sitePages } = require('./build');
    const post = {
        url: '/blog/example/',
        title: 'Example',
        date: '2026-01-02',
        summary: 'Summary',
        tags: [],
        sourcePath: 'blog/example.md',
        html: '<p>Body</p>',
        markdown: '</textarea><script>alert(1)</script>',
    };
    const html = sitePages([], [post])
        .find((page) => page.url === post.url)
        .render();
    assert.ok(html.includes('id="copy-markdown"'));
    assert.ok(html.includes('src="/assets/copy-markdown.js"'));
    assert.ok(html.includes('&lt;/textarea&gt;&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('copy control writes the Markdown and offers manual selection if denied', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const script = fs.readFileSync(path.join(__dirname, '../ui/assets/copy-markdown.js'), 'utf8');
    for (const denied of [false, true]) {
        let click;
        let copied;
        const button = {
            hidden: true,
            addEventListener: (_, handler) => {
                click = handler;
            },
        };
        const source = {
            value: 'Markdown',
            hidden: true,
            focus() {
                this.focused = true;
            },
            select() {
                this.selected = true;
            },
        };
        const status = {};
        vm.runInNewContext(script, {
            document: {
                getElementById: (id) =>
                    ({
                        'copy-markdown': button,
                        'post-markdown': source,
                        'copy-markdown-status': status,
                    })[id],
            },
            navigator: {
                clipboard: {
                    writeText: async (value) => {
                        if (denied) throw Error('Denied');
                        copied = value;
                    },
                },
            },
            clearTimeout() {},
            setTimeout() {},
        });
        assert.equal(button.hidden, false);
        await click();
        if (denied) {
            assert.equal(source.hidden, false);
            assert.equal(source.selected, true);
            assert.equal(source.focused, true);
        } else {
            assert.equal(copied, 'Markdown');
            assert.equal(button.textContent, 'Copied!');
        }
    }
});

test('Markdown export includes Dev.to front matter with safe strings and an absolute cover URL', () => {
    const post = {
        ...examplePost,
        title: 'SRT: "two" paths # together',
        summary: 'First line.\nSecond line.',
        image: 'images/bonded-cover.jpg',
        markdown: 'Body.',
    };
    const copied = exportMarkdown(post, site);
    assert.equal(
        copied,
        [
            '---',
            'title: ' + JSON.stringify(post.title),
            'published: true',
            'canonical_url: "https://live-miracles.github.io/blog/example/"',
            'description: ' + JSON.stringify(post.summary),
            'tags: "srt, bonding, goryu, mediamtx"',
            'cover_image: "https://live-miracles.github.io/blog/images/bonded-cover.jpg"',
            '---',
            '',
            'Body.',
            '',
        ].join('\n'),
    );
});

test('Markdown export marks draft previews unpublished and omits an absent cover', () => {
    const copied = exportMarkdown(
        { ...examplePost, draft: true, tags: [], markdown: 'Body.' },
        site,
    );
    assert.ok(copied.includes('published: false\n'));
    assert.ok(copied.includes('tags: ""\n'));
    assert.ok(!copied.includes('cover_image:'));
});
