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
    github: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z"/></svg>`,
    website: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>`,
    demo: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m10 8 6 4-6 4V8Z"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5Z"/></svg>`,
    fork: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="6" cy="4" r="2"/><circle cx="18" cy="4" r="2"/><circle cx="12" cy="20" r="2"/><path d="M6 6v3a3 3 0 0 0 3 3h3m6-6v3a3 3 0 0 1-3 3h-3m0 0v6"/></svg>`,
    collapse: `<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>`,
    menu: `<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>`,
    blog: `<svg xmlns="http://www.w3.org/2000/svg" class="size-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z"/><path d="M8 9h7M8 13h7M8 17h4"/></svg>`,
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

// Wide screens show the sidebar in full or as a slim rail of project icons (the
// `data-rail` attribute on the drawer, see layout()); small screens always get
// the full drawer. Names stay in `title` and `aria-label` for the rail.
function sidebar(activeId) {
    const groups = categories
        .map((category, index) => {
            const items = projects
                .filter((project) => project.category === category.id)
                .map((project) => {
                    const active = project.id === activeId;
                    return `<a href="${projectUrl(project)}" title="${escapeHtml(project.name)}" aria-label="${escapeHtml(project.name)}" class="rounded-box hover:bg-base-100 flex items-center gap-3 px-3 py-2 lg:group-data-[rail]/drawer:justify-center lg:group-data-[rail]/drawer:px-0 ${active ? 'bg-base-100 text-primary font-semibold' : ''}"${active ? ' aria-current="page"' : ''}>
                ${projectIcon(project, 'size-6')}
                <span class="lg:group-data-[rail]/drawer:hidden">${escapeHtml(project.name)}</span>
              </a>`;
                })
                .join('');
            return `<div class="mb-5 lg:group-data-[rail]/drawer:mb-3">
              ${index ? '<hr class="border-base-content/10 mb-3 hidden lg:group-data-[rail]/drawer:block" />' : ''}
              <div class="text-base-content/50 mb-1 px-3 text-xs font-semibold tracking-wider uppercase lg:group-data-[rail]/drawer:hidden">${escapeHtml(category.name)}</div>
              ${items}
            </div>`;
        })
        .join('');

    return `<aside class="drawer-side z-30">
        <label for="project-drawer" aria-label="Close projects" class="drawer-overlay"></label>
        <nav class="border-base-content/10 bg-base-200 min-h-full w-80 border-r p-4 lg:group-data-[rail]/drawer:w-16 lg:group-data-[rail]/drawer:p-2" aria-label="Projects">
          <div class="mb-6 flex items-center justify-between gap-2 lg:group-data-[rail]/drawer:flex-col lg:group-data-[rail]/drawer:gap-3">
            <a href="/" title="${siteName}" aria-label="${siteName}" class="rounded-box flex items-center gap-3 px-3 py-2 lg:group-data-[rail]/drawer:p-0">
              <img src="/assets/logo.png" alt="" class="rounded-box size-11" />
              <span class="lg:group-data-[rail]/drawer:hidden">
                <span class="block text-xl font-bold">${siteName}</span>
                <span class="text-base-content/58 text-sm">Open tools for live teams</span>
              </span>
            </a>
            <button type="button" id="sidebar-toggle" class="btn btn-ghost btn-sm btn-square hidden lg:inline-flex lg:group-data-[rail]/drawer:rotate-180" aria-label="Collapse projects to icons">${icons.collapse}</button>
          </div>
          <a href="/blog/" title="Blog" aria-label="Blog" class="rounded-box hover:bg-base-100 mb-5 flex items-center gap-3 px-3 py-2 lg:group-data-[rail]/drawer:mb-3 lg:group-data-[rail]/drawer:justify-center lg:group-data-[rail]/drawer:px-0 ${activeId === 'blog' ? 'bg-base-100 text-primary font-semibold' : ''}"${activeId === 'blog' ? ' aria-current="page"' : ''}>
            ${icons.blog}
            <span class="lg:group-data-[rail]/drawer:hidden">Blog</span>
          </a>
          ${groups}
        </nav>
      </aside>`;
}

// Click-to-enlarge for screenshots in README and docs content. Images inside
// links and small images (badges, icons) are left alone. Without JavaScript the
// images stay plain.
function lightbox() {
    return `<dialog id="lightbox" class="lightbox" aria-label="Enlarged image">
      <button type="button" class="btn btn-circle btn-sm lightbox-close" aria-label="Close image">${icons.close}</button>
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

// The projects sidebar's full/rail state is remembered per browser; `railByDefault`
// applies until the visitor has chosen. An inline script right after the drawer
// opens sets the state before the sidebar renders, so the page does not jump.
function layout({
    title,
    description,
    canonicalPath,
    ogImage,
    activeId,
    body,
    railByDefault = false,
    ogType = 'website',
}) {
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
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />
    <link rel="icon" href="/assets/logo.png" type="image/png" />
    <link rel="alternate" type="application/rss+xml" title="${siteName} blog" href="/blog/feed.xml" />
    <link rel="stylesheet" href="/assets/styles.css" />
  </head>
  <body>
    <div class="group/drawer drawer lg:drawer-open">
      <script>
        window.setSidebarRail = function (rail) {
          document.querySelector('.drawer').toggleAttribute('data-rail', rail);
          var toggle = document.getElementById('sidebar-toggle');
          if (toggle) {
            toggle.setAttribute('aria-label', rail ? 'Expand projects' : 'Collapse projects to icons');
          }
        };
        window.sidebarRail = function () {
          try {
            var saved = localStorage.getItem('sidebar-rail');
            if (saved) return saved === '1';
          } catch (e) {}
          return ${railByDefault};
        };
        window.setSidebarRail(window.sidebarRail());
      </script>
      <input id="project-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content min-h-screen min-w-0">
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
      <script>
        window.setSidebarRail(window.sidebarRail());
        document.getElementById('sidebar-toggle').addEventListener('click', function () {
          var rail = !window.sidebarRail();
          try {
            localStorage.setItem('sidebar-rail', rail ? '1' : '0');
          } catch (e) {}
          window.setSidebarRail(rail);
        });
      </script>
    </div>
    ${lightbox()}
  </body>
</html>
`;
}

function starCount(repo) {
    return repo
        ? `<span class="text-base-content/58 inline-flex items-center gap-1 text-sm">${icons.star}${compact.format(repo.stargazers_count)}</span>`
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
          ${latestPosts(posts)}
          ${sections}`;

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

// The docs pages grouped by section. Shown beside the content on docs pages on
// wide screens and above it otherwise.
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
              ${groups
                  .map(
                      (group, i) => `<div class="${i ? 'mt-4' : ''}">
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

// Overview and Documentation tabs under the project header. Docs pages stay
// under the Documentation tab.
function projectTabs(project, docs, activeTab) {
    if (!docs.length) return '';
    const tab = (id, url, label) =>
        `<a role="tab" href="${url}" class="tab ${activeTab === id ? 'tab-active font-semibold' : ''}"${activeTab === id ? ' aria-current="page"' : ''}>${label}</a>`;
    return `<div role="tablist" class="tabs tabs-border mt-6" aria-label="${escapeHtml(project.name)} sections">
              ${tab('overview', projectUrl(project), 'Overview')}${tab('docs', docsUrl(project), 'Documentation')}
            </div>`;
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
            ${tabs}
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
        railByDefault: true,
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
        ogImage: doc.rendered.ogImage || socialImage(project.id) || readme?.ogImage,
        railByDefault: true,
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
    return tags
        .map((tag) => `<span class="badge badge-outline badge-sm">${escapeHtml(tag)}</span>`)
        .join('');
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
                  ) => `<article class="card border-base-content/10 bg-base-200/68 border shadow-xl backdrop-blur">
              <div class="card-body gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex min-w-0 flex-col gap-2">
                  <div class="text-base-content/60 text-sm"><time datetime="${post.date}">${formatDate(post.date)}</time></div>
                  <h2 class="card-title"><a class="hover:text-primary" href="${post.url}">${escapeHtml(post.title)}</a></h2>
                  <p class="text-base-content/70 text-sm leading-6">${escapeHtml(post.summary)}</p>
                  <div class="flex flex-wrap gap-2 pt-1">${tagBadges(post.tags)}</div>
                </div>
                ${post.image ? `<a href="${post.url}" tabindex="-1" aria-hidden="true" class="order-first shrink-0 sm:order-last sm:w-56 lg:w-64">${postImage(post, 'border-base-content/10 rounded-box w-full border')}</a>` : ''}
              </div>
            </article>`,
              )
              .join('')
        : '<p class="text-base-content/70">No posts yet.</p>';
    return layout({
        title: `Blog — ${siteName}`,
        description: blogDescription,
        canonicalPath: '/blog/',
        activeId: 'blog',
        body: `<header>
            <h1 class="text-3xl font-bold sm:text-4xl">Blog</h1>
            <p class="text-base-content/64 mt-2">${escapeHtml(blogDescription)} <a class="link" href="/blog/feed.xml">RSS feed</a></p>
          </header>
          <div class="grid gap-4">${list}</div>`,
    });
}

function blogPostPage(post) {
    return layout({
        title: `${post.title} — ${siteName}`,
        description: post.summary,
        canonicalPath: post.url,
        activeId: 'blog',
        railByDefault: true,
        ogType: 'article',
        ogImage: post.image
            ? /^https?:\/\//.test(post.image)
                ? post.image
                : `${siteUrl}${post.image}`
            : undefined,
        body: `<nav class="text-base-content/60 flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
            <a href="/blog/" class="hover:text-primary">Blog</a>
          </nav>
          <header>
            <h1 class="text-3xl font-bold sm:text-4xl">${escapeHtml(post.title)}</h1>
            <div class="text-base-content/60 mt-3 flex flex-wrap items-center gap-3 text-sm">
              <time datetime="${post.date}">${formatDate(post.date)}</time>${tagBadges(post.tags)}
            </div>
          </header>
          ${post.image ? postImage(post, 'border-base-content/10 w-full rounded-box border') : ''}
          <article class="readme min-w-0">${post.html}</article>
          <a class="link text-base-content/50 text-sm" href="https://github.com/${organization}/${organization}.github.io/blob/${branch}/${post.sourcePath}">Edit this post on GitHub</a>`,
    });
}

// The newest posts on the home page; nothing when there are none.
function latestPosts(posts) {
    if (!posts.length) return '';
    const items = posts
        .slice(0, 3)
        .map(
            (post) => `<li class="flex flex-wrap items-baseline justify-between gap-x-4">
              <a class="link link-hover font-semibold" href="${post.url}">${escapeHtml(post.title)}</a>
              <time class="text-base-content/60 text-sm" datetime="${post.date}">${formatDate(post.date)}</time>
            </li>`,
        )
        .join('');
    return `<section id="blog" class="scroll-mt-20">
            <h2 class="text-2xl font-bold">From the blog</h2>
            <ul class="mt-3 flex flex-col gap-2">${items}</ul>
            <a class="link mt-3 inline-block text-sm" href="/blog/">All posts</a>
          </section>`;
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
