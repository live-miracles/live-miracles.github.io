// Reads the blog posts in blog/: Markdown files named YYYY-MM-DD-slug.md that
// start with front matter (title, date, summary, tags, draft). Drafts are not
// built. A post that cannot be read is skipped with a warning, so one bad file
// never stops the site from building.

const fs = require('node:fs');
const path = require('node:path');

const postFile = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;

function parseValue(raw) {
    const value = raw.trim();
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value.startsWith('[') && value.endsWith(']')) {
        return value
            .slice(1, -1)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return value.replace(/^(['"])(.*)\1$/, '$2');
}

// Front matter is `key: value` lines between two `---` lines. Values are plain
// text, true/false, or a `[a, b]` list; that is all the posts need.
function parseFrontMatter(source) {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
    if (!match) throw new Error('missing front matter');
    const data = {};
    for (const line of match[1].split(/\r?\n/)) {
        if (!line.trim()) continue;
        const pair = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
        if (!pair) throw new Error(`cannot read front matter line "${line}"`);
        data[pair[1]] = parseValue(pair[2]);
    }
    return { data, body: source.slice(match[0].length) };
}

function readPost(file, name) {
    const [, fileDate, slug] = postFile.exec(name);
    const { data, body } = parseFrontMatter(fs.readFileSync(file, 'utf8'));
    for (const field of ['title', 'date', 'summary']) {
        if (typeof data[field] !== 'string' || !data[field]) throw new Error(`no ${field}`);
    }
    if (data.date !== fileDate) {
        throw new Error(`date ${data.date} does not match the file name date ${fileDate}`);
    }
    return {
        slug,
        title: data.title,
        date: data.date,
        summary: data.summary,
        tags: Array.isArray(data.tags) ? data.tags : [],
        draft: data.draft === true,
        markdown: body,
        sourcePath: `blog/${name}`,
    };
}

// Published posts, newest first.
function loadPosts(dir) {
    if (!fs.existsSync(dir)) return [];
    const posts = [];
    for (const name of fs.readdirSync(dir).sort()) {
        if (!postFile.test(name)) continue;
        try {
            const post = readPost(path.join(dir, name), name);
            if (!post.draft) posts.push(post);
        } catch (error) {
            console.warn(`[warn] blog: skipping ${name} (${error.message})`);
        }
    }
    return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

module.exports = { parseFrontMatter, loadPosts };
