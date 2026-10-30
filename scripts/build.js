// Renders the site into dist/ (built aside and swapped in once complete, so a
// failed build leaves the previous dist/ in place): a home page listing every project, one static
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
// GitHub data is fetched at build time (see project-source.js). Set GITHUB_TOKEN
// to avoid the API's unauthenticated rate limit. A project whose README or metadata cannot be
// fetched still gets a page (summary and links) and the build logs a warning.
// LOCAL_PROJECTS=<id>=<path>[,<id>=<path>] reads a project's README and docs
// from a local checkout instead, to preview documentation before pushing it.
// BUILD_CACHE_DIR=<dir> keeps each fetched response there and reuses it, so
// the dev server's rebuilds on save do not hit the GitHub API again.
//
// The Markdown posts in blog/ become /blog/<slug>/ pages, a /blog/ index and an
// RSS feed at /blog/feed.xml (see blog.js); posts marked `draft: true` are left out
// unless BLOG_DRAFTS=1 is set, to preview them locally.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { organization, categories, projects } = require('./projects');
const { escapeHtml, stripTags } = require('./markdown-text');
const { parseMarkdownPage, linkResolver, absoluteUrl } = require('./markdown-page');
const { loadPosts, renderFeed, blogDescription } = require('./blog');
const { createProjectSource, parseLocalProjects } = require('./project-source');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const siteUrl = `https://${organization}.github.io`;
const siteName = 'Live Miracles';
const siteDescription =
    'Open-source tools for live production teams: restreaming, SRT bonding, vMix control, stream monitoring and multilingual event workflows.';
const branch = 'master';
const localProjects = parseLocalProjects(process.env.LOCAL_PROJECTS);
const source = createProjectSource({
    organization,
    branch,
    token: process.env.GITHUB_TOKEN,
    localProjects,
    cacheDir: process.env.BUILD_CACHE_DIR,
});

const iconClass = 'size-4 shrink-0';
const icons = {
    star: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5Z"/></svg>`,
    fork: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="6" cy="4" r="2"/><circle cx="18" cy="4" r="2"/><circle cx="12" cy="20" r="2"/><path d="M6 6v3a3 3 0 0 0 3 3h3m6-6v3a3 3 0 0 1-3 3h-3m0 0v6"/></svg>`,
    github: `<svg xmlns="http://www.w3.org/2000/svg" class="size-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z"/></svg>`,
    sun: `<svg xmlns="http://www.w3.org/2000/svg" class="icon-sun size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon-moon size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>`,
};

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function renderMarkdown(markdown, project, repoPath, siteUrls) {
    const rawBase = `https://raw.githubusercontent.com/${organization}/${project.id}/${branch}/${repoPath}`;
    const blobBase = `https://github.com/${organization}/${project.id}/blob/${branch}/`;
    const { html, toc, ogImage } = parseMarkdownPage(markdown, {
        rewriteLink: linkResolver({ blobBase, repoPath, siteUrls }),
        rewriteImage: (href) => absoluteUrl(href, rawBase),
    });
    return { html, toc, ogImage };
}

// The link-preview card of the home page (`home`) or of a project (its id) is
// ui/assets/social/<name>.png, 1280x640. Without one, a project falls back to the
// first screenshot of its README.
function socialImage(name) {
    const file = path.join(root, 'ui', 'assets', 'social', `${name}.png`);
    return fs.existsSync(file) ? `${siteUrl}/assets/social/${name}.png` : undefined;
}

function projectUrl(project) {
    return `/projects/${project.id}/`;
}

function projectIcon(project, size) {
    if (!project.icon) {
        return `<span class="logo-letter ${size}" aria-hidden="true">${escapeHtml(project.name[0])}</span>`;
    }
    // Dark logos (iconOnLight) get a light tile so they stay visible in dark mode.
    const tile = project.iconOnLight ? 'logo-light' : '';
    return `<img src="${escapeHtml(project.icon)}" alt="" class="logo ${size} ${tile}" />`;
}

// Links to the project's other places. Pills in a project's header, plain text links in
// a home page card.
function linkButtons(project, style = 'pill') {
    const links = [
        ['GitHub', `https://github.com/${organization}/${project.id}`],
        ['Website', project.website],
        ['Demo', project.demo],
        ['Download', project.download],
    ];
    return links
        .filter(([, href]) => href)
        .map(([label, href], index) =>
            style === 'pill'
                ? `<a class="pill ${index ? '' : 'pill-primary'}" href="${escapeHtml(href)}">${label}</a>`
                : `<a class="text-accent hover:underline" href="${escapeHtml(href)}">${label}</a>`,
        )
        .join('');
}

// The CSS variable that points a band or page at its category's pattern (see ui/styles.css).
function patternVar(category) {
    return `--pattern: url('/assets/patterns/${category.pattern}.svg')`;
}

// Pseudo-randomness seeded by a name, so every page glows from its own spot but always the
// same one: no JavaScript, and builds and screenshots stay reproducible.
function seeded(seed) {
    let h = 2166136261;
    for (const char of seed) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
    return () => {
        h = Math.imul(h ^ (h >>> 15), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
}

// The CSS variables that place a page's glows (see .wash and .wash-hero in ui/styles.css):
// left and right glow positions, whether their colours swap sides, and where the pattern sits.
function glowVars(seed) {
    const random = seeded(seed);
    const between = (min, max) => Math.round(min + random() * (max - min));
    const flip = random() < 0.5;
    return [
        `--gx1: ${between(0, 40)}%`,
        `--gx2: ${between(60, 100)}%`,
        `--gx3: ${between(25, 75)}%`,
        `--gy1: ${between(-140, 0)}px`,
        `--gy2: ${between(-140, 0)}px`,
        `--gy1p: ${between(0, 30)}%`,
        `--gy2p: ${between(0, 30)}%`,
        `--px: ${between(70, 100)}%`,
        ...(flip ? ['--glow-1: var(--glow-b)', '--glow-2: var(--glow-a)'] : []),
    ].join('; ');
}

// One narrow column of content, centred on the page, under a colour wash. A project's
// pages take the wash from its category's tint; `seed` places the glows.
function page(inner, width = 'max-w-[980px]', category, seed = 'page') {
    const vars = [glowVars(seed)];
    if (category) {
        vars.push(
            `--tint: ${category.tint}`,
            `--glow-a: color-mix(in srgb, ${category.tint} 30%, transparent)`,
            patternVar(category),
        );
    }
    return `<div class="wash" style="${vars.join('; ')}"><div class="mx-auto w-full ${width} px-5 py-10 sm:px-6 sm:py-14">${inner}</div></div>`;
}

// A full-width band; neighbouring bands alternate between parchment and canvas so the
// colour change itself divides the sections. A band with a category also shows that
// category's pattern in its colour; any shade other than parchment or canvas is used as a class.
function band(inner, shade, extra = '', category, seed) {
    const background =
        { parchment: 'band band-parchment', canvas: 'band band-canvas' }[shade] ?? shade;
    const vars = [];
    if (category) vars.push(`--tint: ${category.tint}`, patternVar(category));
    if (seed) vars.push(glowVars(seed));
    const style = vars.length ? ` style="${vars.join('; ')}"` : '';
    return `<div class="${background} ${extra}"${style}><div class="mx-auto w-full max-w-[980px] px-5 sm:px-6">${inner}</div></div>`;
}

function topbar(activeId) {
    const link = (href, label, active) =>
        `<a href="${href}" class="${active ? 'text-ink' : 'text-muted'} hover:text-ink transition-colors"${active ? ' aria-current="page"' : ''}>${label}</a>`;
    return `<header class="topbar">
        <nav class="caption mx-auto flex h-12 w-full max-w-[1024px] items-center justify-between gap-4 px-5 sm:px-6" aria-label="Site">
          <a href="/" class="flex items-center gap-2.5 font-semibold" aria-label="${siteName}">
            <img src="/assets/logo.png" alt="" class="logo size-6" />
            <span>${siteName}</span>
          </a>
          <div class="flex items-center gap-5 sm:gap-7">
            ${link('/#projects', 'Projects', false)}
            ${link('/blog/', 'Blog', activeId === 'blog')}
            <div class="-mr-2 flex items-center gap-1">
              <a href="https://github.com/${organization}" class="icon-btn" aria-label="${siteName} on GitHub" title="GitHub">${icons.github}</a>
              <button type="button" id="theme-toggle" class="icon-btn theme-toggle" hidden>${icons.sun}${icons.moon}</button>
            </div>
          </div>
        </nav>
      </header>`;
}

// Click-to-enlarge for screenshots in README and docs content. Images inside
// links and small images (badges, icons) are left alone. Without JavaScript the
// images stay plain.
function lightbox() {
    return `<dialog id="lightbox" class="lightbox" aria-label="Enlarged image">
      <button type="button" class="lightbox-close" aria-label="Close image">${icons.close}</button>
      <div class="lightbox-frame"><img alt="" /></div>
    </dialog>
    <script>
      (function () {
        var dialog = document.getElementById('lightbox');
        if (!dialog || !dialog.showModal) return;
        var shown = dialog.querySelector('img');
        function zoomable(img) {
          return !img.closest('a') && img.naturalWidth >= 300 && img.naturalHeight >= 100;
        }
        function mark(img) {
          if (img.dataset.zoom || !zoomable(img)) return;
          img.dataset.zoom = '1';
          img.classList.add('zoomable');
          img.tabIndex = 0;
          img.setAttribute('role', 'button');
          img.setAttribute('aria-label', 'Enlarge image: ' + (img.alt || 'screenshot'));
        }
        function open(img) {
          shown.src = img.currentSrc || img.src;
          shown.alt = img.alt;
          shown.classList.remove('actual');
          dialog.showModal();
          dialog.scrollTo(0, 0);
        }
        document.querySelectorAll('.readme img').forEach(function (img) {
          if (img.complete) mark(img);
          else img.addEventListener('load', function () { mark(img); }, { once: true });
        });
        document.addEventListener('click', function (event) {
          var img = event.target.closest && event.target.closest('.readme img');
          if (img && img.dataset.zoom) open(img);
        });
        document.addEventListener('keydown', function (event) {
          var img = event.target.closest && event.target.closest('.readme img');
          if (img && img.dataset.zoom && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            open(img);
          }
        });
        shown.addEventListener('click', function () {
          shown.classList.toggle('actual');
        });
        dialog.addEventListener('click', function (event) {
          if (event.target !== shown) dialog.close();
        });
      })();
    </script>`;
}

function layout({
    title,
    description,
    canonicalPath,
    ogImage,
    activeId,
    body,
    ogType = 'website',
}) {
    const canonical = `${siteUrl}${canonicalPath}`;
    const image = ogImage || `${siteUrl}/assets/logo.png`;
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />
    <link rel="icon" href="/assets/logo.png" type="image/png" />
    <link rel="alternate" type="application/rss+xml" title="${siteName} blog" href="/blog/feed.xml" />
    <script>
      try {
        var theme = localStorage.getItem('theme');
        if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
      } catch (e) {}
    </script>
    <link rel="stylesheet" href="/assets/styles.css" />
  </head>
  <body class="flex min-h-screen flex-col">
    ${topbar(activeId)}
    <main class="flex-1">${body}</main>
    <footer class="caption waves text-muted border-line border-t pb-28">
      <div class="mx-auto flex w-full max-w-[980px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-8 sm:px-6">
        <span>${siteName} · Open tools for live teams</span>
        <span class="flex gap-5">
          <a class="link-quiet" href="/blog/">Blog</a>
          <a class="link-quiet" href="/blog/feed.xml">RSS</a>
          <a class="link-quiet" href="https://github.com/${organization}">GitHub</a>
        </span>
      </div>
    </footer>
    ${lightbox()}
    <script>
      (function () {
        var button = document.getElementById('theme-toggle');
        if (!button) return;
        var root = document.documentElement;
        var dark = window.matchMedia('(prefers-color-scheme: dark)');
        function current() {
          return root.dataset.theme || (dark.matches ? 'dark' : 'light');
        }
        function sync() {
          var theme = current();
          button.dataset.mode = theme;
          button.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme');
        }
        button.hidden = false;
        sync();
        if (dark.addEventListener) dark.addEventListener('change', sync);
        button.addEventListener('click', function () {
          var next = current() === 'dark' ? 'light' : 'dark';
          root.dataset.theme = next;
          try {
            localStorage.setItem('theme', next);
          } catch (e) {}
          sync();
        });
      })();
    </script>
  </body>
</html>
`;
}

function starCount(repo) {
    return repo
        ? `<span class="text-muted caption inline-flex items-center gap-1">${icons.star}${compact.format(repo.stargazers_count)}</span>`
        : '';
}

function homePage(data, posts) {
    const totals = data.reduce(
        (sum, { repo }) => ({
            stars: sum.stars + (repo?.stargazers_count ?? 0),
            forks: sum.forks + (repo?.forks_count ?? 0),
        }),
        { stars: 0, forks: 0 },
    );
    const stat = (value, label) =>
        `<div><div class="display grad-text text-4xl sm:text-5xl">${value}</div><div class="caption text-muted mt-1">${label}</div></div>`;

    // The bands after the hero alternate shade; a card takes the opposite one so it
    // stands out from its band.
    const shadeAt = (index) => (index % 2 === 0 ? 'parchment' : 'canvas');

    const sections = categories
        .map((category, index) => {
            const shade = shadeAt(index);
            const cardShade = shade === 'parchment' ? '' : 'card-alt';
            const cards = data
                .filter(({ project }) => project.category === category.id)
                .map(
                    ({ project, repo }) => `<article class="card ${cardShade}">
                <div class="flex items-center justify-between gap-3">
                  <a href="${projectUrl(project)}" class="flex items-center gap-3">
                    ${projectIcon(project, 'size-11')}
                    <h3 class="display text-xl">${escapeHtml(project.name)}</h3>
                  </a>
                  ${starCount(repo)}
                </div>
                <p class="text-muted text-[0.9375rem] leading-6">${escapeHtml(project.summary)}</p>
                <div class="caption mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-3">
                  <a class="more" href="${projectUrl(project)}">Learn more</a>
                  ${linkButtons(project, 'text')}
                </div>
              </article>`,
                )
                .join('');
            return band(
                `<section id="${category.id}" class="scroll-mt-12">
            <h2 class="display display-lg tint-dot">${escapeHtml(category.name)}</h2>
            <p class="lead mt-2 mb-8">${escapeHtml(category.summary)}</p>
            <div class="grid gap-5 md:grid-cols-2">${cards}</div>
          </section>`,
                shade,
                'py-16 sm:py-20',
                category,
            );
        })
        .join('');

    // The backdrop is only atmosphere (see .hero-art), so it carries no alt text.
    const hero = band(
        `<section class="flex flex-col items-center py-16 text-center sm:py-24 lg:items-start lg:py-28 lg:text-left">
            <div class="hero-art" aria-hidden="true"></div>
            <p class="eyebrow relative">${siteName}</p>
            <h1 class="display display-hero relative mt-3 max-w-3xl">Open tools for <span class="grad-text">live teams.</span></h1>
            <p class="lead relative mt-6 max-w-xl">${escapeHtml(siteDescription)}</p>
            <div class="relative mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a class="pill pill-primary pill-lg" href="#projects">Browse projects</a>
              <a class="pill pill-lg" href="https://github.com/${organization}">View on GitHub</a>
            </div>
            <p class="text-muted relative mt-10 max-w-md text-[0.9375rem]">
              Built and used by a live-streaming team that runs large multilingual events.
            </p>
            <div class="relative mt-6 flex gap-12 sm:gap-16">
              ${stat(projects.length, 'Projects')}
              ${stat(compact.format(totals.stars), 'GitHub stars')}
              ${stat(compact.format(totals.forks), 'Forks')}
            </div>
          </section>`,
        'wash-hero relative overflow-hidden',
        '',
        undefined,
        'home',
    );

    const body = `${hero}
          <div id="projects" class="scroll-mt-12">${sections}</div>
          ${latestPosts(posts, shadeAt(categories.length))}`;

    return layout({
        title: `${siteName} — open tools for live production and streaming`,
        description: siteDescription,
        canonicalPath: '/',
        ogImage: socialImage('home'),
        activeId: null,
        body,
    });
}

function contentsBox(toc) {
    if (toc.length <= 1) return '';
    return `<details class="bg-parchment text-muted caption mb-8 rounded-xl p-4">
              <summary class="text-ink cursor-pointer font-semibold">On this page</summary>
              <ol class="mt-3 space-y-2">
                ${toc
                    .map(
                        (item) =>
                            `<li class="${item.level > 2 ? 'pl-4' : ''}"><a class="link-quiet hover:text-accent block leading-5 ${item.level === 2 ? 'text-ink' : ''}" href="#${item.slug}">${escapeHtml(item.label)}</a></li>`,
                    )
                    .join('')}
              </ol>
            </details>`;
}

// The docs pages grouped by section. Shown beside the content on docs pages on
// wide screens and above it otherwise.
function docsNav(project, docs, activeUrl) {
    if (!docs.length) return '';
    const item = (url, label) => {
        const active = url === activeUrl;
        return `<li><a href="${url}" class="link-quiet hover:text-ink block py-1 ${active ? 'text-ink font-semibold' : 'text-muted'}"${active ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a></li>`;
    };
    const groups = [];
    for (const doc of docs) {
        const last = groups.at(-1);
        if (last && last.section === doc.section) last.docs.push(doc);
        else groups.push({ section: doc.section, docs: [doc] });
    }
    return `<nav class="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto" aria-label="${escapeHtml(project.name)} documentation">
              ${groups
                  .map(
                      (group, i) => `<div class="${i ? 'mt-5' : ''}">
                ${group.section ? `<div class="eyebrow mb-1">${escapeHtml(group.section)}</div>` : ''}
                <ul class="caption">${group.docs.map((doc) => item(doc.url, doc.title)).join('')}</ul>
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

// Overview and Documentation tabs under the project header. Docs pages stay
// under the Documentation tab.
function projectTabs(project, docs, activeTab) {
    if (!docs.length) return '';
    const tab = (id, url, label) =>
        `<a href="${url}" class="tab"${activeTab === id ? ' aria-current="page"' : ''}>${label}</a>`;
    return `<nav class="border-line mt-8 flex gap-6 border-b" aria-label="${escapeHtml(project.name)} sections">
              ${tab('overview', projectUrl(project), 'Overview')}${tab('docs', docsUrl(project), 'Documentation')}
            </nav>`;
}

// Shared frame for a project's overview, docs index and docs pages: header,
// Overview/Documentation tabs, then the content. Docs pages also get the docs
// navigation beside the content.
function projectFrame({ project, repo, docs, activeUrl, header, content }) {
    const isDocs = activeUrl !== projectUrl(project);
    const tabs = projectTabs(project, docs, isDocs ? 'docs' : 'overview');
    const nav = isDocs ? docsNav(project, docs, activeUrl) : '';
    // Wide screens show the navigation beside the content; small screens get it
    // collapsed above the content so the page starts with the text.
    const main = nav
        ? `<details class="bg-parchment caption mt-6 rounded-xl p-4 lg:hidden">
              <summary class="cursor-pointer font-semibold">Documentation menu</summary>
              <div class="mt-3">${nav}</div>
            </details>
            <div class="mt-10 grid gap-12 lg:grid-cols-[13rem_minmax(0,1fr)]">
              <div class="hidden lg:block">${nav}</div>
              <div class="min-w-0">${content}</div>
            </div>`
        : `<div class="mt-10">${content}</div>`;
    const category = categories.find((category) => category.id === project.category);
    return page(`${header}${tabs}${main}`, undefined, category, project.id);
}

function projectHeader(project, repo) {
    const topics = (repo?.topics ?? [])
        .map((topic) => `<span class="chip">${escapeHtml(topic)}</span>`)
        .join('');
    return `<div class="flex items-center gap-5">
              ${projectIcon(project, 'size-16')}
              <h1 class="display display-lg">${escapeHtml(project.name)}</h1>
            </div>
            <p class="lead mt-5 max-w-3xl">${escapeHtml(project.summary)}</p>
            <div class="mt-7 flex flex-wrap gap-3">${linkButtons(project)}</div>
            <div class="text-muted caption mt-6 flex flex-wrap gap-x-5 gap-y-1">${projectFacts(repo)}</div>
            ${topics ? `<div class="mt-4 flex flex-wrap gap-2">${topics}</div>` : ''}`;
}

function docHeader(project, crumbs, title) {
    return `<nav class="text-muted caption flex flex-wrap items-center gap-2" aria-label="Breadcrumb">
              <a href="${projectUrl(project)}" class="link-quiet hover:text-ink flex items-center gap-2">${projectIcon(project, 'size-5')}<span>${escapeHtml(project.name)}</span></a>
              ${crumbs.map((crumb) => `<span aria-hidden="true">›</span>${crumb.url ? `<a class="link-quiet hover:text-ink" href="${crumb.url}">${escapeHtml(crumb.label)}</a>` : `<span>${escapeHtml(crumb.label)}</span>`}`).join('')}
            </nav>
            <h1 class="display display-lg mt-4">${escapeHtml(title)}</h1>`;
}

function projectPage({ project, repo, readme, docs }) {
    const content = readme
        ? `${contentsBox(readme.toc)}<article class="readme min-w-0">${readme.html}</article>`
        : `<div class="notice">The README could not be loaded when this page was built. Open the project on GitHub for its documentation.</div>`;
    return layout({
        title: `${project.name} — ${siteName}`,
        description: project.summary,
        canonicalPath: projectUrl(project),
        ogImage: socialImage(project.id) || readme?.ogImage,
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
        ogImage: socialImage(project.id) || readme?.ogImage,
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
    const pager = `<div class="mt-12 grid gap-4 sm:grid-cols-2">
              ${previous ? `<a class="panel link-quiet hover:bg-parchment p-5 transition-colors" href="${previous.url}"><div class="text-muted caption">Previous</div><div class="font-semibold">${escapeHtml(previous.title)}</div></a>` : '<span></span>'}
              ${next ? `<a class="panel link-quiet hover:bg-parchment p-5 transition-colors sm:text-right" href="${next.url}"><div class="text-muted caption">Next</div><div class="font-semibold">${escapeHtml(next.title)}</div></a>` : ''}
            </div>`;
    const edit = `<a class="more caption mt-8 inline-block" href="https://github.com/${organization}/${project.id}/blob/${branch}/${doc.repoPath}">Edit this page on GitHub</a>`;
    const crumbs = [{ label: 'Documentation', url: docsUrl(project) }];
    if (doc.section) crumbs.push({ label: doc.section });
    return layout({
        title: `${doc.title} — ${project.name}`,
        description: doc.description || `${doc.title}: ${project.name} documentation.`,
        canonicalPath: doc.url,
        ogImage: doc.rendered.ogImage || socialImage(project.id) || readme?.ogImage,
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

function formatDate(date) {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}

function tagBadges(tags) {
    return tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join('');
}

// The header image of a post, written in front matter relative to blog/.
function postImage(post, classes) {
    return `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt)}" class="${classes}" loading="lazy" />`;
}

function blogIndexPage(posts) {
    const list = posts.length
        ? posts
              .map(
                  (
                      post,
                  ) => `<article class="border-line grid gap-6 border-t py-8 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-center">
              <div class="flex min-w-0 flex-col gap-2">
                <div class="text-muted caption"><time datetime="${post.date}">${formatDate(post.date)}</time></div>
                <h2 class="display text-2xl"><a class="link-quiet hover:text-accent" href="${post.url}">${escapeHtml(post.title)}</a></h2>
                <p class="text-muted text-[0.9375rem] leading-6">${escapeHtml(post.summary)}</p>
                <div class="flex flex-wrap gap-2 pt-1">${tagBadges(post.tags)}</div>
              </div>
              ${post.image ? `<a href="${post.url}" tabindex="-1" aria-hidden="true" class="order-first sm:order-last">${postImage(post, 'w-full rounded-xl')}</a>` : ''}
            </article>`,
              )
              .join('')
        : '<p class="text-muted">No posts yet.</p>';
    return layout({
        title: `Blog — ${siteName}`,
        description: blogDescription,
        canonicalPath: '/blog/',
        activeId: 'blog',
        body: page(
            `<header class="mb-8">
            <h1 class="display display-hero">Blog</h1>
            <p class="lead mt-4 max-w-2xl">${escapeHtml(blogDescription)} <a class="more" href="/blog/feed.xml">RSS feed</a></p>
          </header>
          <div>${list}</div>`,
            undefined,
            undefined,
            'blog',
        ),
    });
}

function blogPostPage(post) {
    return layout({
        title: `${post.title} — ${siteName}`,
        description: post.summary,
        canonicalPath: post.url,
        activeId: 'blog',
        ogType: 'article',
        ogImage: post.image
            ? /^https?:\/\//.test(post.image)
                ? post.image
                : `${siteUrl}${post.image}`
            : undefined,
        body: page(
            `<nav class="text-muted caption" aria-label="Breadcrumb">
            <a href="/blog/" class="link-quiet hover:text-ink">Blog</a>
          </nav>
          <header class="mt-4 mb-8">
            <h1 class="display display-lg">${escapeHtml(post.title)}</h1>
            <div class="text-muted caption mt-4 flex flex-wrap items-center gap-3">
              <time datetime="${post.date}">${formatDate(post.date)}</time>${tagBadges(post.tags)}
            </div>
          </header>
          ${post.image ? postImage(post, 'mb-10 w-full rounded-2xl') : ''}
          <article class="readme min-w-0">${post.html}</article>
          <a class="more caption mt-10 inline-block" href="https://github.com/${organization}/${organization}.github.io/blob/${branch}/${post.sourcePath}">Edit this post on GitHub</a>`,
            'max-w-[720px]',
            undefined,
            post.url,
        ),
    });
}

// The newest posts on the home page; nothing when there are none.
function latestPosts(posts, shade) {
    if (!posts.length) return '';
    const items = posts
        .slice(0, 3)
        .map(
            (
                post,
            ) => `<li class="border-line flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t py-4">
              <a class="link-quiet hover:text-accent text-lg font-semibold" href="${post.url}">${escapeHtml(post.title)}</a>
              <time class="text-muted caption" datetime="${post.date}">${formatDate(post.date)}</time>
            </li>`,
        )
        .join('');
    return band(
        `<section id="blog" class="scroll-mt-12">
            <h2 class="display display-lg mb-6">From the blog</h2>
            <ul class="border-line border-b">${items}</ul>
            <a class="more mt-6 inline-block" href="/blog/">All posts</a>
          </section>`,
        shade,
        'py-16 sm:py-20',
    );
}

function notFoundPage() {
    return layout({
        title: `Page not found — ${siteName}`,
        description: siteDescription,
        canonicalPath: '/404.html',
        activeId: null,
        body: page(
            `<section class="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <h1 class="display display-hero">Page not found</h1>
            <p class="lead mt-5">Pick a project from the <a class="more" href="/#projects">list</a>, or go back to the <a class="more" href="/">home page</a>.</p>
          </section>`,
            undefined,
            undefined,
            'not-found',
        ),
    });
}

// Every page the site renders from the data: its URL, when it last changed and
// a function that renders it. The files written, the sitemap and the page count
// all come from this list.
function sitePages(data, posts) {
    const today = new Date().toISOString().slice(0, 10);
    const pages = [
        { url: '/', lastmod: today, render: () => homePage(data, posts) },
        { url: '/blog/', lastmod: posts[0]?.date ?? today, render: () => blogIndexPage(posts) },
    ];
    for (const post of posts) {
        pages.push({ url: post.url, lastmod: post.date, render: () => blogPostPage(post) });
    }
    for (const entry of data) {
        const { project, repo, docs } = entry;
        const lastmod = repo?.pushed_at?.slice(0, 10) ?? today;
        pages.push({ url: projectUrl(project), lastmod, render: () => projectPage(entry) });
        if (!docs.length) continue;
        pages.push({ url: docsUrl(project), lastmod, render: () => docsIndexPage(entry) });
        docs.forEach((doc, index) => {
            pages.push({ url: doc.url, lastmod, render: () => docPage(entry, doc, index) });
        });
    }
    return pages;
}

function sitemap(pages) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url><loc>${siteUrl}${page.url}</loc><lastmod>${page.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}

// Fetches and renders one project's README and docs. Any failure leaves that
// part empty (logged as a warning) instead of failing the whole build.
async function loadProject(project) {
    const { repo, readme, docs, docsIndex, problems } = await source.load(project.id);
    for (const { part, message } of problems) {
        console.warn(`[warn] ${project.id}: ${part} unavailable (${message})`);
    }
    const docList = docs.map((doc) => ({ ...doc, url: `${projectUrl(project)}docs/${doc.slug}/` }));

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
    return {
        project,
        repo,
        readme: readme === null ? null : renderMarkdown(readme, project, 'README.md', siteUrls),
        docs: docList,
        docsIndex:
            docsIndex === null
                ? null
                : renderMarkdown(docsIndex, project, 'docs/README.md', siteUrls),
    };
}

// Everything the build reads, so the dev server knows what to watch: the blog,
// the UI, these scripts and, for a LOCAL_PROJECTS checkout, its README and docs/.
function inputPaths() {
    const paths = ['blog', 'ui', 'scripts'].map((name) => path.join(root, name));
    for (const local of localProjects.values()) {
        paths.push(path.resolve(local, 'docs'), path.resolve(local, 'README.md'));
    }
    return paths;
}

// Writes every file of the site into `out`, except the stylesheet.
async function renderSite(out) {
    function writeFile(relativePath, content) {
        const file = path.join(out, relativePath);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
    }

    fs.cpSync(path.join(root, 'ui', 'assets'), path.join(out, 'assets'), { recursive: true });
    writeFile('.nojekyll', '');

    const data = await Promise.all(projects.map(loadProject));
    const posts = loadPosts(path.join(root, 'blog'), {
        includeDrafts: process.env.BLOG_DRAFTS === '1',
    });

    const blogImages = path.join(root, 'blog', 'images');
    if (fs.existsSync(blogImages)) {
        fs.cpSync(blogImages, path.join(out, 'blog', 'images'), { recursive: true });
    }
    writeFile(path.join('blog', 'feed.xml'), renderFeed(posts, { siteUrl, siteName }));
    const pages = sitePages(data, posts);
    for (const page of pages) writeFile(path.join(page.url, 'index.html'), page.render());
    writeFile('404.html', notFoundPage());
    writeFile('sitemap.xml', sitemap(pages));
    writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
    return `${pages.length} pages (${data.length} projects, ${posts.length} blog posts)`;
}

// The utility classes come from the markup in these scripts (see ui/styles.css).
function buildStyles(out) {
    const bin = path.join(
        root,
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'tailwindcss.cmd' : 'tailwindcss',
    );
    execFileSync(
        bin,
        [
            '-i',
            path.join(root, 'ui', 'styles.css'),
            '-o',
            path.join(out, 'assets', 'styles.css'),
            '--minify',
        ],
        { cwd: root, stdio: 'inherit' },
    );
}

// Builds into a folder of its own and swaps it in as dist/ once complete, so
// dist/ is never half written and a failed build leaves the last one in place.
// The folder sits beside dist/ (a rename needs one filesystem) and is ignored
// by git and Tailwind like dist/ (see .gitignore and ui/styles.css).
async function main() {
    const stage = `${dist}.next-${process.pid}`;
    fs.rmSync(stage, { recursive: true, force: true });
    fs.mkdirSync(stage, { recursive: true });
    try {
        const summary = await renderSite(stage);
        buildStyles(stage);
        fs.rmSync(dist, { recursive: true, force: true });
        fs.renameSync(stage, dist);
        console.log(`Built ${summary} into dist/`);
    } finally {
        fs.rmSync(stage, { recursive: true, force: true });
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}

module.exports = { sitePages, sitemap, inputPaths };
