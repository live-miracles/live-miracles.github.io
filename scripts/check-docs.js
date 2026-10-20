#!/usr/bin/env node
// Checks the Markdown a project publishes on this site: its README.md and the
// pages under docs/. Run it against a checkout:
//
//     node scripts/check-docs.js [path-to-project]      (default: the current directory)
//
// It reports, and exits 1 on any of:
//   - a relative link or image whose target file does not exist in the checkout
//     (only files git tracks, or would track, count, as in the site build, so a
//     gitignored note is a broken link),
//   - a #anchor, on the same page or on another Markdown page, that matches no
//     heading (GitHub's anchor rule, shared with the build),
//   - a docs page that docs/README.md does not link to.
// External links are not fetched. Projects call this from their own CI, so a
// broken link is caught before it reaches the published site.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { Marked } = require('marked');
const { githubSlug } = require('./markdown-text');

const projectDir = path.resolve(process.argv[2] ?? '.');

const files = new Set(
    execFileSync(
        'git',
        ['-C', projectDir, 'ls-files', '--cached', '--others', '--exclude-standard'],
        {
            encoding: 'utf8',
        },
    )
        .split('\n')
        .filter(Boolean),
);

const pages = [...files]
    .filter((file) => file === 'README.md' || /^docs\/.+\.md$/.test(file))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

// Links and heading anchors of one page, collected the way the site build
// renders it (the first level-1 heading is the page title and has no anchor).
function readPage(repoPath) {
    const markdown = fs.readFileSync(path.join(projectDir, repoPath), 'utf8');
    const links = [];
    const slugs = new Set();
    const slugCounts = new Map();
    let skippedTitle = false;
    const marked = new Marked({ gfm: true, breaks: false });
    marked.use({
        walkTokens(token) {
            if (token.type === 'link' || token.type === 'image') {
                links.push({ href: token.href, text: token.text });
            }
        },
        renderer: {
            heading(text, level) {
                if (level === 1 && !skippedTitle) {
                    skippedTitle = true;
                    return '';
                }
                slugs.add(githubSlug(text, slugCounts));
                return '';
            },
            html(html) {
                for (const match of html.matchAll(/\s(?:src|href)="([^"]*)"/g)) {
                    links.push({ href: match[1], text: match[1] });
                }
                return '';
            },
        },
    });
    marked.parse(markdown);
    return { links, slugs };
}

const parsed = new Map(pages.map((page) => [page, readPage(page)]));
const problems = [];
const linkedFromIndex = new Set();

// The repository path a relative link points at, with the anchor split off.
function resolveTarget(fromPage, href) {
    const url = new URL(href, `https://repo.invalid/${fromPage}`);
    return {
        target: decodeURIComponent(url.pathname.slice(1)),
        hash: decodeURIComponent(url.hash.slice(1)),
    };
}

function targetExists(target) {
    if (files.has(target)) return target;
    const dir = target.replace(/\/$/, '');
    // A link to a folder shows its README on GitHub and on the site.
    if (files.has(`${dir}/README.md`)) return `${dir}/README.md`;
    if (dir === '' || [...files].some((file) => file.startsWith(`${dir}/`))) return dir;
    return null;
}

for (const [page, { links }] of parsed) {
    for (const { href, text } of links) {
        if (!href || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue;
        const label = `${page}: [${String(text).slice(0, 60)}](${href})`;
        if (href.startsWith('#')) {
            const slug = decodeURIComponent(href.slice(1));
            if (slug && !parsed.get(page).slugs.has(slug)) {
                problems.push(`${label} has no matching heading on this page`);
            }
            continue;
        }
        const { target, hash } = resolveTarget(page, href);
        const found = targetExists(target);
        if (!found) {
            problems.push(`${label} points at a file that does not exist (${target})`);
            continue;
        }
        if (page === 'docs/README.md') linkedFromIndex.add(found);
        if (hash && parsed.has(found) && !parsed.get(found).slugs.has(hash)) {
            problems.push(`${label} has no matching heading in ${found}`);
        }
    }
}

const docPages = pages.filter((page) => page.startsWith('docs/') && page !== 'docs/README.md');
if (docPages.length > 0 && !files.has('docs/README.md')) {
    problems.push('docs/README.md is missing, so no docs page is indexed');
} else {
    for (const page of docPages) {
        if (!linkedFromIndex.has(page)) problems.push(`${page} is not linked from docs/README.md`);
    }
}

if (problems.length > 0) {
    console.error(`Found ${problems.length} documentation problem(s) in ${projectDir}:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
}
console.log(`Checked ${pages.length} pages in ${projectDir}: no broken links or unindexed pages.`);
