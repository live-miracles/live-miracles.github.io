// Renders the site into dist/: a home page listing every project, one static
// page per project at /projects/<id>/ built from its README on master, plus
// sitemap.xml, robots.txt and 404.html. Pages are plain HTML (no client-side
// rendering) so search engines and link previews see each project.
//
// A project with a docs/ folder also gets its Markdown pages rendered under
// /projects/<id>/docs/, ordered by path: number prefixes such as
// docs/1-getting-started/2-docker.md set the order and are dropped from URLs
// (/projects/<id>/docs/getting-started/docker/). Relative links between the
// README and docs pages are rewritten to the site's URLs.
//
// GitHub data is fetched at build time. Set GITHUB_TOKEN to avoid the API's
// unauthenticated rate limit. A project whose README or metadata cannot be
// fetched still gets a page (summary and links) and the build logs a warning.
// LOCAL_PROJECTS=<id>=<path>[,<id>=<path>] reads a project's README and docs
// from a local checkout instead, to preview documentation before pushing it.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { Marked } = require('marked');
const { organization, categories, projects } = require('./projects');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const siteUrl = `https://${organization}.github.io`;
const siteName = 'Live Miracles';
const siteDescription =
    'Open-source tools for live production teams: restreaming, SRT bonding, vMix control, stream monitoring and multilingual event workflows.';
const branch = 'master';
const fetchTimeoutMs = 15000;

const iconClass = 'size-4 shrink-0';
const icons = {
    github: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z"/></svg>`,
    website: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>`,
    demo: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m10 8 6 4-6 4V8Z"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5Z"/></svg>`,
    fork: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="6" cy="4" r="2"/><circle cx="18" cy="4" r="2"/><circle cx="12" cy="20" r="2"/><path d="M6 6v3a3 3 0 0 0 3 3h3m6-6v3a3 3 0 0 1-3 3h-3m0 0v6"/></svg>`,
    menu: `<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>`,
};

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function decodeEntities(value) {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
}

function stripTags(html) {
    return decodeEntities(html.replace(/<[^>]*>/g, ''));
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

async function fetchWithRetry(url, options = {}) {
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(fetchTimeoutMs),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
        } catch (error) {
            lastError = error;
        }
    }
    throw new Error(`${url}: ${lastError.message}`);
}

async function fetchRepo(id) {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetchWithRetry(`https://api.github.com/repos/${organization}/${id}`, {
        headers,
    });
    return response.json();
}

const localProjects = new Map(
    (process.env.LOCAL_PROJECTS ?? '')
        .split(',')
        .filter(Boolean)
        .map((entry) => entry.split('=')),
);

async function fetchFile(id, repoPath) {
    const local = localProjects.get(id);
    if (local) return fs.readFileSync(path.join(local, repoPath), 'utf8');
    const response = await fetchWithRetry(
        `https://raw.githubusercontent.com/${organization}/${id}/${branch}/${repoPath}`,
    );
    return response.text();
}

// Markdown files under docs/, as repository paths. Local checkouts list only
// files git would track, so gitignored notes are never published.
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
        const headers = { Accept: 'application/vnd.github+json' };
        if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
        const response = await fetchWithRetry(
            `https://api.github.com/repos/${organization}/${id}/git/trees/${branch}?recursive=1`,
            { headers },
        );
        paths = (await response.json()).tree.map((entry) => entry.path);
    }
    return paths
        .filter((repoPath) => /^docs\/.+\.md$/.test(repoPath) && repoPath !== 'docs/README.md')
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

function stripOrder(name) {
    return name.replace(/\.md$/, '').replace(/^\d+-/, '');
}

function humanize(name) {
    const words = stripOrder(name).replace(/-/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
}

async function fetchDocs(project) {
    const repoPaths = await listDocs(project.id);
    const docs = [];
    for (const repoPath of repoPaths) {
        const parts = repoPath.split('/').slice(1);
        const markdown = await fetchFile(project.id, repoPath);
        const title = markdown.match(/^# (.+)$/m)?.[1].trim() ?? humanize(parts.at(-1));
        docs.push({
            repoPath,
            markdown,
            title: stripTags(title.replace(/`/g, '')),
            section: parts.length > 1 ? humanize(parts[0]) : null,
            url: `${projectUrl(project)}docs/${parts.map(stripOrder).join('/')}/`,
        });
    }
    return docs;
}

// GitHub's heading anchor rule, so links like #capacity--limits written for
// github.com keep working here.
function githubSlug(text, counts) {
    const base = stripTags(text)
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s_-]/gu, '')
        .replace(/\s/g, '-');
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    return seen ? `${base}-${seen}` : base;
}

function absoluteUrl(value, base) {
    if (!value || /^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(value)) return value;
    return new URL(value, base).href;
}

// Rewrites a link found in <repoPath>: README and docs pages go to their
// pages on this site, other repository files to GitHub, anchors stay as they
// are.
function linkResolver(project, repoPath, siteUrls) {
    const blobBase = `https://github.com/${organization}/${project.id}/blob/${branch}/`;
    return (href) => {
        if (!href || /^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)) return href;
        const resolved = new URL(href, `https://repo.invalid/${repoPath}`);
        const target = decodeURIComponent(resolved.pathname.slice(1)).replace(/\/$/, '/README.md');
        const page = siteUrls.get(target);
        if (page) return page + resolved.hash;
        return new URL(href, blobBase + repoPath).href;
    };
}

function renderMarkdown(markdown, project, repoPath, siteUrls) {
    const rawBase = `https://raw.githubusercontent.com/${organization}/${project.id}/${branch}/${repoPath}`;
    const resolveLink = linkResolver(project, repoPath, siteUrls);
    const slugCounts = new Map();
    const toc = [];
    const images = [];
    let skippedTitle = false;

    const marked = new Marked({ gfm: true, breaks: false });
    marked.use({
        walkTokens(token) {
            if (token.type === 'image') token.href = absoluteUrl(token.href, rawBase);
            if (token.type === 'link') token.href = resolveLink(token.href);
        },
        renderer: {
            heading(text, level) {
                // The page header already shows the project or page title.
                if (level === 1 && !skippedTitle) {
                    skippedTitle = true;
                    return '';
                }
                const slug = githubSlug(text, slugCounts);
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
                    const url =
                        attribute === 'src' ? absoluteUrl(value, rawBase) : resolveLink(value);
                    if (attribute === 'src') images.push(url);
                    return ` ${attribute}="${url}"`;
                });
            },
        },
    });

    const html = marked.parse(markdown);
    // Link previews use the first real screenshot, not a status badge.
    const ogImage = images.find(
        (url) => /^https:\/\//.test(url) && !/\.svg(\?|$)|shields\.io|\/badge/i.test(url),
    );
    return { html, toc, ogImage };
}

function projectUrl(project) {
    return `/projects/${project.id}/`;
}

function projectIcon(project, size) {
    if (!project.icon) {
        return `<span class="rounded-box bg-primary/15 text-primary ${size} grid shrink-0 place-items-center font-bold" aria-hidden="true">${escapeHtml(project.name[0])}</span>`;
    }
    // Dark logos (iconOnLight) get a light tile so they stay visible on the dim theme.
    const tile = project.iconOnLight ? 'bg-base-content p-0.5' : '';
    return `<img src="${escapeHtml(project.icon)}" alt="" class="rounded-box ${size} ${tile} shrink-0 object-contain" />`;
}

function linkButtons(project) {
    const links = [
        ['GitHub', `https://github.com/${organization}/${project.id}`, 'btn-primary', icons.github],
        ['Website', project.website, 'btn-accent', icons.website],
        ['Demo', project.demo, 'btn-accent', icons.demo],
        ['Download', project.download, 'btn-accent', icons.download],
    ];
    return links
        .filter(([, href]) => href)
        .map(
            ([label, href, tone, icon]) =>
                `<a class="btn btn-sm ${tone} gap-2" href="${escapeHtml(href)}">${icon}<span>${label}</span></a>`,
        )
        .join('');
}

function sidebar(activeId) {
    const groups = categories
        .map((category) => {
            const items = projects
                .filter((project) => project.category === category.id)
                .map((project) => {
                    const active = project.id === activeId;
                    return `<a href="${projectUrl(project)}" class="rounded-box hover:bg-base-100 flex items-center gap-3 px-3 py-2 ${active ? 'bg-base-100 text-primary font-semibold' : ''}"${active ? ' aria-current="page"' : ''}>
                ${projectIcon(project, 'size-6')}
                <span>${escapeHtml(project.name)}</span>
              </a>`;
                })
                .join('');
            return `<div class="mb-5">
              <div class="text-base-content/50 mb-1 px-3 text-xs font-semibold tracking-wider uppercase">${escapeHtml(category.name)}</div>
              ${items}
            </div>`;
        })
        .join('');

    return `<aside class="drawer-side z-30">
        <label for="project-drawer" aria-label="Close projects" class="drawer-overlay"></label>
        <nav class="border-base-content/10 bg-base-200 min-h-full w-80 border-r p-4" aria-label="Projects">
          <a href="/" class="rounded-box mb-6 flex items-center gap-3 px-3 py-2">
            <img src="/assets/logo.png" alt="" class="rounded-box size-11" />
            <span>
              <span class="block text-xl font-bold">${siteName}</span>
              <span class="text-base-content/58 text-sm">Open tools for live teams</span>
            </span>
          </a>
          ${groups}
        </nav>
      </aside>`;
}

function layout({ title, description, canonicalPath, ogImage, activeId, body, head = '' }) {
    const canonical = `${siteUrl}${canonicalPath}`;
    const image = ogImage || `${siteUrl}/assets/logo.png`;
    return `<!doctype html>
<html lang="en" data-theme="dim">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />
    <link rel="icon" href="/assets/logo.png" type="image/png" />
    <link rel="stylesheet" href="/assets/styles.css" />
    ${head}
  </head>
  <body>
    <div class="drawer lg:drawer-open">
      <input id="project-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content min-h-screen">
        <header class="navbar border-base-content/10 bg-base-300/92 sticky top-0 z-20 border-b px-4 backdrop-blur lg:hidden">
          <div class="flex-none">
            <label for="project-drawer" class="btn btn-square btn-ghost" aria-label="Open projects">${icons.menu}</label>
          </div>
          <div class="flex-1">
            <a href="/" class="btn btn-ghost text-lg font-bold">${siteName}</a>
          </div>
        </header>
        <main class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
          ${body}
          <footer class="text-base-content/50 border-base-content/10 mt-auto border-t pt-6 pb-2 text-sm">
            ${siteName} · <a class="link" href="https://github.com/${organization}">github.com/${organization}</a>
          </footer>
        </main>
      </div>
      ${sidebar(activeId)}
    </div>
  </body>
</html>
`;
}

function starCount(repo) {
    return repo
        ? `<span class="text-base-content/58 inline-flex items-center gap-1 text-sm">${icons.star}${compact.format(repo.stargazers_count)}</span>`
        : '';
}

function homePage(data) {
    const totals = data.reduce(
        (sum, { repo }) => ({
            stars: sum.stars + (repo?.stargazers_count ?? 0),
            forks: sum.forks + (repo?.forks_count ?? 0),
        }),
        { stars: 0, forks: 0 },
    );

    const sections = categories
        .map((category) => {
            const cards = data
                .filter(({ project }) => project.category === category.id)
                .map(
                    ({
                        project,
                        repo,
                    }) => `<article class="card border-base-content/10 bg-base-200/68 border shadow-xl backdrop-blur">
              <div class="card-body gap-3">
                <div class="flex items-center justify-between gap-3">
                  <a href="${projectUrl(project)}" class="flex items-center gap-3">
                    ${projectIcon(project, 'size-10')}
                    <h3 class="card-title hover:text-primary">${escapeHtml(project.name)}</h3>
                  </a>
                  ${starCount(repo)}
                </div>
                <p class="text-base-content/70 text-sm leading-6">${escapeHtml(project.summary)}</p>
                <div class="card-actions mt-auto pt-2">
                  <a class="btn btn-sm btn-outline" href="${projectUrl(project)}">Details</a>
                  ${linkButtons(project)}
                </div>
              </div>
            </article>`,
                )
                .join('');
            return `<section id="${category.id}" class="scroll-mt-20">
            <h2 class="text-2xl font-bold">${escapeHtml(category.name)}</h2>
            <p class="text-base-content/64 mt-1 mb-4">${escapeHtml(category.summary)}</p>
            <div class="grid gap-4 md:grid-cols-2">${cards}</div>
          </section>`;
        })
        .join('');

    // The previous single-page site linked projects as /#<project-id>.
    const redirect = `<script>
      (function () {
        var ids = ${JSON.stringify(projects.map((project) => project.id))};
        var id = location.hash.slice(1);
        if (ids.indexOf(id) !== -1) location.replace('/projects/' + id + '/');
      })();
    </script>`;

    const body = `<section class="flex items-center justify-center pt-10 pb-4 text-center sm:pt-16">
            <div class="flex max-w-3xl flex-col items-center">
              <div class="badge badge-primary badge-outline mb-5">Open tools for live teams</div>
              <h1 class="text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">${siteName}</h1>
              <p class="text-base-content/78 mt-5 text-lg leading-8">${escapeHtml(siteDescription)}</p>
              <p class="text-base-content/64 mt-4 leading-7">
                Built and used by a live-streaming team that runs large multilingual events.
              </p>
              <div class="stats stats-vertical border-base-content/10 bg-base-200/58 sm:stats-horizontal mt-8 w-full border text-left shadow-xl backdrop-blur">
                <div class="stat"><div class="stat-title">Projects</div><div class="stat-value text-2xl">${projects.length}</div></div>
                <div class="stat"><div class="stat-title">Stars</div><div class="stat-value text-2xl"><span class="inline-flex items-center gap-2">${icons.star}${compact.format(totals.stars)}</span></div></div>
                <div class="stat"><div class="stat-title">Forks</div><div class="stat-value text-2xl"><span class="inline-flex items-center gap-2">${icons.fork}${compact.format(totals.forks)}</span></div></div>
              </div>
            </div>
          </section>
          ${sections}`;

    return layout({
        title: `${siteName} — open tools for live production and streaming`,
        description: siteDescription,
        canonicalPath: '/',
        activeId: null,
        body,
        head: redirect,
    });
}

function contentsBox(toc) {
    if (toc.length <= 1) return '';
    return `<details class="rounded-box border-base-content/10 bg-base-300/46 text-base-content/68 mb-7 border p-4 text-sm backdrop-blur">
              <summary class="text-base-content/80 cursor-pointer font-semibold">On this page</summary>
              <ol class="mt-3 space-y-2">
                ${toc
                    .map(
                        (item) =>
                            `<li class="${item.level > 2 ? 'pl-4' : ''}"><a class="hover:text-primary block leading-5 ${item.level === 2 ? 'text-base-content/80 font-semibold' : ''}" href="#${item.slug}">${escapeHtml(item.label)}</a></li>`,
                    )
                    .join('')}
              </ol>
            </details>`;
}

// The project's own navigation: overview (README) plus its docs pages grouped
// by section. Shown beside the content on wide screens and above it otherwise.
function docsNav(project, docs, activeUrl) {
    if (!docs.length) return '';
    const item = (url, label) => {
        const active = url === activeUrl;
        return `<li><a href="${url}" class="rounded-field hover:bg-base-100 block px-3 py-1.5 ${active ? 'bg-base-100 text-primary font-semibold' : 'text-base-content/75'}"${active ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a></li>`;
    };
    const groups = [];
    for (const doc of docs) {
        const last = groups.at(-1);
        if (last && last.section === doc.section) last.docs.push(doc);
        else groups.push({ section: doc.section, docs: [doc] });
    }
    return `<nav class="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto" aria-label="${escapeHtml(project.name)} documentation">
              <ul class="text-sm">${item(projectUrl(project), 'Overview')}${item(docsUrl(project), 'Documentation')}</ul>
              ${groups
                  .map(
                      (group) => `<div class="mt-4">
                ${group.section ? `<div class="text-base-content/50 mb-1 px-3 text-xs font-semibold tracking-wider uppercase">${escapeHtml(group.section)}</div>` : ''}
                <ul class="text-sm">${group.docs.map((doc) => item(doc.url, doc.title)).join('')}</ul>
              </div>`,
                  )
                  .join('')}
            </nav>`;
}

function docsUrl(project) {
    return `${projectUrl(project)}docs/`;
}

function projectFacts(repo) {
    if (!repo) return '';
    const facts = [
        `<span class="inline-flex items-center gap-1">${icons.star}${compact.format(repo.stargazers_count)}</span>`,
        `<span class="inline-flex items-center gap-1">${icons.fork}${compact.format(repo.forks_count)}</span>`,
    ];
    if (repo.language) facts.push(`<span>${escapeHtml(repo.language)}</span>`);
    if (repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION') {
        facts.push(`<span>${escapeHtml(repo.license.spdx_id)} license</span>`);
    }
    facts.push(`<span>Updated ${escapeHtml(repo.pushed_at.slice(0, 10))}</span>`);
    return facts.join('');
}

// Shared frame for a project's overview, docs index and docs pages: header,
// optional docs navigation, then the content.
function projectFrame({ project, repo, docs, activeUrl, header, content }) {
    const nav = docsNav(project, docs, activeUrl);
    // Wide screens show the navigation beside the content; small screens get it
    // collapsed above the content so the page starts with the text.
    const main = nav
        ? `<details class="rounded-box border-base-content/10 bg-base-300/46 mt-6 border p-4 lg:hidden">
              <summary class="text-base-content/80 cursor-pointer text-sm font-semibold">Documentation menu</summary>
              <div class="mt-3">${nav}</div>
            </details>
            <div class="mt-7 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <div class="border-base-content/10 hidden lg:block lg:border-r lg:pr-4">${nav}</div>
              <div class="min-w-0">${content}</div>
            </div>`
        : `<div class="mt-7">${content}</div>`;
    return `<section class="rounded-box border-base-content/10 bg-base-200/68 border p-5 shadow-xl backdrop-blur sm:p-7">
            ${header}
            ${main}
          </section>`;
}

function projectHeader(project, repo) {
    const topics = (repo?.topics ?? [])
        .map((topic) => `<span class="badge badge-outline badge-sm">${escapeHtml(topic)}</span>`)
        .join('');
    return `<div class="flex items-start gap-4">
              ${projectIcon(project, 'size-14')}
              <div class="min-w-0">
                <h1 class="text-3xl font-bold sm:text-4xl">${escapeHtml(project.name)}</h1>
                <p class="text-base-content/78 mt-2 text-lg leading-7">${escapeHtml(project.summary)}</p>
              </div>
            </div>
            <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
              <div class="flex flex-wrap gap-2">${linkButtons(project)}</div>
              <div class="text-base-content/58 flex flex-wrap gap-4 text-sm">${projectFacts(repo)}</div>
            </div>
            ${topics ? `<div class="mt-4 flex flex-wrap gap-2">${topics}</div>` : ''}`;
}

function docHeader(project, crumbs, title) {
    return `<nav class="text-base-content/60 flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
              <a href="${projectUrl(project)}" class="hover:text-primary flex items-center gap-2">${projectIcon(project, 'size-5')}<span>${escapeHtml(project.name)}</span></a>
              ${crumbs.map((crumb) => `<span aria-hidden="true">›</span>${crumb.url ? `<a class="hover:text-primary" href="${crumb.url}">${escapeHtml(crumb.label)}</a>` : `<span>${escapeHtml(crumb.label)}</span>`}`).join('')}
            </nav>
            <h1 class="mt-3 text-3xl font-bold sm:text-4xl">${escapeHtml(title)}</h1>`;
}

function projectPage({ project, repo, readme, docs }) {
    const content = readme
        ? `${contentsBox(readme.toc)}<article class="readme min-w-0">${readme.html}</article>`
        : `<div class="alert alert-warning">The README could not be loaded when this page was built. Open the project on GitHub for its documentation.</div>`;
    return layout({
        title: `${project.name} — ${siteName}`,
        description: project.summary,
        canonicalPath: projectUrl(project),
        ogImage: readme?.ogImage,
        activeId: project.id,
        body: projectFrame({
            project,
            repo,
            docs,
            activeUrl: projectUrl(project),
            header: projectHeader(project, repo),
            content,
        }),
    });
}

function docsIndexPage({ project, repo, readme, docs, docsIndex }) {
    let content;
    if (docsIndex) {
        content = `<article class="readme min-w-0">${docsIndex.html}</article>`;
    } else {
        const sections = [];
        for (const doc of docs) {
            const last = sections.at(-1);
            if (last && last.section === doc.section) last.docs.push(doc);
            else sections.push({ section: doc.section, docs: [doc] });
        }
        content = `<article class="readme min-w-0">${sections
            .map(
                (group) =>
                    `${group.section ? `<h2>${escapeHtml(group.section)}</h2>` : ''}<ul>${group.docs.map((doc) => `<li><a href="${doc.url}">${escapeHtml(doc.title)}</a></li>`).join('')}</ul>`,
            )
            .join('')}</article>`;
    }
    return layout({
        title: `${project.name} documentation — ${siteName}`,
        description: `Documentation for ${project.name}: ${project.summary}`,
        canonicalPath: docsUrl(project),
        ogImage: readme?.ogImage,
        activeId: project.id,
        body: projectFrame({
            project,
            repo,
            docs,
            activeUrl: docsUrl(project),
            header: docHeader(project, [{ label: 'Documentation' }], 'Documentation'),
            content,
        }),
    });
}

function docPage({ project, repo, readme, docs }, doc, index) {
    const previous = docs[index - 1];
    const next = docs[index + 1];
    const pager = `<div class="border-base-content/10 mt-10 grid gap-3 border-t pt-6 sm:grid-cols-2">
              ${previous ? `<a class="rounded-box border-base-content/10 hover:border-primary/50 border p-4" href="${previous.url}"><div class="text-base-content/50 text-xs">Previous</div><div class="font-semibold">${escapeHtml(previous.title)}</div></a>` : '<span></span>'}
              ${next ? `<a class="rounded-box border-base-content/10 hover:border-primary/50 border p-4 sm:text-right" href="${next.url}"><div class="text-base-content/50 text-xs">Next</div><div class="font-semibold">${escapeHtml(next.title)}</div></a>` : ''}
            </div>`;
    const edit = `<a class="link text-base-content/50 mt-6 inline-block text-sm" href="https://github.com/${organization}/${project.id}/blob/${branch}/${doc.repoPath}">Edit this page on GitHub</a>`;
    const crumbs = [{ label: 'Documentation', url: docsUrl(project) }];
    if (doc.section) crumbs.push({ label: doc.section });
    return layout({
        title: `${doc.title} — ${project.name}`,
        description: doc.description || `${doc.title}: ${project.name} documentation.`,
        canonicalPath: doc.url,
        ogImage: doc.rendered.ogImage || readme?.ogImage,
        activeId: project.id,
        body: projectFrame({
            project,
            repo,
            docs,
            activeUrl: doc.url,
            header: docHeader(project, crumbs, doc.title),
            content: `${contentsBox(doc.rendered.toc)}<article class="readme min-w-0">${doc.rendered.html}</article>${edit}${pager}`,
        }),
    });
}

function notFoundPage() {
    return layout({
        title: `Page not found — ${siteName}`,
        description: siteDescription,
        canonicalPath: '/404.html',
        activeId: null,
        body: `<section class="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <h1 class="text-4xl font-bold">Page not found</h1>
            <p class="text-base-content/70 mt-4">Pick a project from the list, or go back to the <a class="link link-primary" href="/">home page</a>.</p>
          </section>`,
    });
}

function sitemap(data) {
    const today = new Date().toISOString().slice(0, 10);
    const urls = [{ loc: `${siteUrl}/`, lastmod: today }];
    for (const { project, repo, docs } of data) {
        const lastmod = repo?.pushed_at?.slice(0, 10) ?? today;
        urls.push({ loc: `${siteUrl}${projectUrl(project)}`, lastmod });
        if (docs.length) urls.push({ loc: `${siteUrl}${docsUrl(project)}`, lastmod });
        for (const doc of docs) urls.push({ loc: `${siteUrl}${doc.url}`, lastmod });
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url.loc}</loc><lastmod>${url.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}

function writeFile(relativePath, content) {
    const file = path.join(dist, relativePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

// Fetches and renders one project's README and docs. Any failure leaves that
// part empty (logged as a warning) instead of failing the whole build.
async function loadProject(project) {
    const [repo, readme, docs] = await Promise.allSettled([
        fetchRepo(project.id),
        fetchFile(project.id, 'README.md'),
        fetchDocs(project),
    ]);
    for (const [label, result] of [
        ['metadata', repo],
        ['README', readme],
        ['docs', docs],
    ]) {
        if (result.status === 'rejected') {
            console.warn(`[warn] ${project.id}: ${label} unavailable (${result.reason.message})`);
        }
    }
    const docList = docs.status === 'fulfilled' ? docs.value : [];

    // Repository paths that have a page on this site, for link rewriting.
    const siteUrls = new Map([['README.md', projectUrl(project)]]);
    if (docList.length) siteUrls.set('docs/README.md', docsUrl(project));
    for (const doc of docList) siteUrls.set(doc.repoPath, doc.url);

    for (const doc of docList) {
        doc.rendered = renderMarkdown(doc.markdown, project, doc.repoPath, siteUrls);
        const firstParagraph = doc.rendered.html.match(/<p>([\s\S]*?)<\/p>/)?.[1];
        doc.description = firstParagraph
            ? stripTags(firstParagraph).replace(/\s+/g, ' ').slice(0, 200)
            : '';
    }
    let docsIndex = null;
    if (docList.length) {
        try {
            const markdown = await fetchFile(project.id, 'docs/README.md');
            docsIndex = renderMarkdown(markdown, project, 'docs/README.md', siteUrls);
        } catch {
            // No docs/README.md: the index page lists the pages instead.
        }
    }
    return {
        project,
        repo: repo.status === 'fulfilled' ? repo.value : null,
        readme:
            readme.status === 'fulfilled'
                ? renderMarkdown(readme.value, project, 'README.md', siteUrls)
                : null,
        docs: docList,
        docsIndex,
    };
}

async function main() {
    fs.rmSync(dist, { recursive: true, force: true });
    fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
    fs.cpSync(path.join(root, 'ui', 'assets'), path.join(dist, 'assets'), { recursive: true });
    writeFile('.nojekyll', '');

    const data = await Promise.all(projects.map(loadProject));

    writeFile('index.html', homePage(data));
    let pageCount = 0;
    for (const entry of data) {
        const base = path.join('projects', entry.project.id);
        writeFile(path.join(base, 'index.html'), projectPage(entry));
        if (entry.docs.length) {
            writeFile(path.join(base, 'docs', 'index.html'), docsIndexPage(entry));
            entry.docs.forEach((doc, index) => {
                writeFile(path.join(doc.url, 'index.html'), docPage(entry, doc, index));
            });
        }
        pageCount += 1 + (entry.docs.length ? entry.docs.length + 1 : 0);
    }
    writeFile('404.html', notFoundPage());
    writeFile('sitemap.xml', sitemap(data));
    writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
    console.log(`Built ${data.length} projects (${pageCount} pages) into dist/`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
