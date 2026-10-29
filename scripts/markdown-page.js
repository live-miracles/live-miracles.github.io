// How a project's Markdown page is read, shared by the site build and the docs
// link checker so a link the checker accepts is a link the build resolves:
// which headings get which anchors, which links and images a page contains, and
// which repository path a relative link points at.

const { Marked } = require('marked');
const { escapeHtml, stripTags, githubSlug } = require('./markdown-text');

const identity = (value) => value;

// A link to a file in the same repository: not a URL with a scheme or a
// protocol-relative one. `#anchor` links count as relative.
function isRelativeLink(href) {
    return Boolean(href) && !/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}

// Resolves `value` against `base` unless it is already absolute, an anchor or empty.
function absoluteUrl(value, base) {
    if (!isRelativeLink(value) || value.startsWith('#')) return value;
    return new URL(value, base).href;
}

// The repository path a relative link in `fromPage` points at, with the anchor
// split off. A link to a folder (with or without a trailing slash) shows the
// folder's README on GitHub and on the site, so `folderReadme` is that path.
function resolveRepoLink(fromPage, href) {
    const url = new URL(href, `https://repo.invalid/${fromPage}`);
    const target = decodeURIComponent(url.pathname.slice(1));
    const folder = target.replace(/\/$/, '');
    return {
        target,
        hash: url.hash,
        folderReadme: folder ? `${folder}/README.md` : 'README.md',
    };
}

// Rewrites links found in <repoPath>: README and docs pages go to their pages
// on this site (`siteUrls` maps repository paths to site URLs), other repository
// files to GitHub under `blobBase`, anchors stay as they are.
function linkResolver({ blobBase, repoPath, siteUrls }) {
    return (href) => {
        if (!isRelativeLink(href) || href.startsWith('#')) return href;
        const { target, hash, folderReadme } = resolveRepoLink(repoPath, href);
        const page = siteUrls.get(target) ?? siteUrls.get(folderReadme);
        if (page) return page + hash;
        return new URL(href, blobBase + repoPath).href;
    };
}

// Renders a page to HTML and reports what it contains. `rewriteLink` and
// `rewriteImage` change the hrefs in the HTML (not the reported `links`).
// - `toc`: the level 2 and 3 headings, for a contents box.
// - `slugs`: every heading anchor on the page. The first level-1 heading is the
//   page title, which the site shows in its own header, so it has no anchor.
// - `links`: every link, image and raw-HTML src/href as written.
// - `ogImage`: the first real screenshot (not a badge), for link previews.
function parseMarkdownPage(
    markdown,
    { rewriteLink = identity, rewriteImage = identity, keepTitle = false } = {},
) {
    const slugCounts = new Map();
    const slugs = new Set();
    const toc = [];
    const links = [];
    const images = [];
    let skippedTitle = keepTitle;

    const marked = new Marked({ gfm: true, breaks: false });
    marked.use({
        walkTokens(token) {
            if (token.type === 'image') {
                links.push({ href: token.href, text: token.text });
                token.href = rewriteImage(token.href);
            }
            if (token.type === 'link') {
                links.push({ href: token.href, text: token.text });
                token.href = rewriteLink(token.href);
            }
        },
        renderer: {
            heading(text, level) {
                if (level === 1 && !skippedTitle) {
                    skippedTitle = true;
                    return '';
                }
                const slug = githubSlug(text, slugCounts);
                slugs.add(slug);
                if (level === 2 || level === 3) toc.push({ slug, level, label: stripTags(text) });
                return `<h${level} id="${slug}">${text}</h${level}>\n`;
            },
            image(href, title, text) {
                images.push(href);
                const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
                return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" />`;
            },
            // Raw HTML in READMEs (mostly <img> tags) can carry relative URLs too.
            html(html) {
                return html.replace(/\s(src|href)="([^"]*)"/g, (match, attribute, value) => {
                    links.push({ href: value, text: value });
                    const url = attribute === 'src' ? rewriteImage(value) : rewriteLink(value);
                    if (attribute === 'src') images.push(url);
                    return ` ${attribute}="${url}"`;
                });
            },
        },
    });

    const html = marked.parse(markdown);
    const ogImage = images.find(
        (url) => /^https:\/\//.test(url) && !/\.svg(\?|$)|shields\.io|\/badge/i.test(url),
    );
    return { html, toc, slugs, links, ogImage };
}

module.exports = { parseMarkdownPage, linkResolver, resolveRepoLink, isRelativeLink, absoluteUrl };
