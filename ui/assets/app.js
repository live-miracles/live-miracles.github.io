const organization = 'live-miracles';

const projects = [
    {
        id: 'delayed-yt',
        name: 'Delayed YT',
        summary:
            'A YouTube delay workflow for live production review, timing, and playback checks.',
        icon: `https://${organization}.github.io/delayed-yt/logo.png`,
        github: `https://github.com/${organization}/delayed-yt`,
        website: `https://${organization}.github.io/delayed-yt/`,
    },
    {
        id: 'folder-player',
        name: 'Folder Player',
        summary:
            'A browser-based media player for folder-oriented playlists and lightweight playback.',
        icon: './assets/folder-player-logo.png',
        github: `https://github.com/${organization}/folder-player`,
        download: `https://github.com/${organization}/folder-player/releases`,
    },
    {
        id: 'key-vault',
        name: 'Key Vault',
        summary:
            'A demo-focused secure key vault interface for storing and previewing secrets safely.',
        icon: `https://${organization}.github.io/key-vault/logo.png`,
        github: `https://github.com/${organization}/key-vault`,
        demo: `https://${organization}.github.io/key-vault/`,
    },
    {
        id: 'live-gallery',
        name: 'Live Gallery',
        summary:
            'A gallery tool for live media workflows, previews, and stream-friendly visual organization.',
        icon: './assets/live-gallery-logo.png',
        github: `https://github.com/${organization}/live-gallery`,
        download: `https://github.com/${organization}/live-gallery/releases`,
    },
    {
        id: 'live-generator',
        name: 'Live Generator',
        summary: 'A live workflow generator for preparing reusable production pages and assets.',
        github: `https://github.com/${organization}/live-generator`,
    },
    {
        id: 'multi-lang-qa',
        name: 'Multi Lang QA',
        summary:
            'A multilingual question-and-answer workflow for teams handling live language support.',
        icon: `https://${organization}.github.io/multi-lang-qa/logo.png`,
        github: `https://github.com/${organization}/multi-lang-qa`,
        demo: `https://${organization}.github.io/multi-lang-qa/`,
    },
    {
        id: 'restream-srs',
        name: 'Restream SRS',
        summary: 'An SRS-based restreaming setup for routing and relaying live video feeds.',
        icon: './assets/restream-srs-logo.png',
        github: `https://github.com/${organization}/restream-srs`,
    },
    {
        id: 'srt-bonding-relay',
        name: 'SRT Bonding Relay',
        summary: 'A relay workflow for resilient SRT transport across bonded network paths.',
        github: `https://github.com/${organization}/srt-bonding-relay`,
    },
    {
        id: 'vmix-master',
        name: 'vMix Master',
        summary: 'A web controller for coordinating multiple vMix systems during live production.',
        icon: `https://${organization}.github.io/vmix-master/logo.svg`,
        github: `https://github.com/${organization}/vmix-master`,
        website: `https://${organization}.github.io/vmix-master/`,
    },
];

const elements = {
    home: document.querySelector('#home'),
    homeStats: document.querySelector('#home-stats'),
    homeTags: document.querySelector('#home-tags'),
    panel: document.querySelector('#project-panel'),
    list: document.querySelector('#project-list'),
    links: document.querySelector('#project-links'),
    stats: document.querySelector('#project-stats'),
    toc: document.querySelector('#readme-toc'),
    readme: document.querySelector('#readme'),
    status: document.querySelector('#status'),
    drawer: document.querySelector('#project-drawer'),
};

marked.setOptions({
    gfm: true,
    breaks: false,
});

const iconClass = 'size-4 shrink-0';
const compactFormatter = Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
});
const icons = {
    github: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z"/></svg>`,
    website: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>`,
    demo: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m10 8 6 4-6 4V8Z"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5Z"/></svg>`,
    fork: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="6" cy="4" r="2"/><circle cx="18" cy="4" r="2"/><circle cx="12" cy="20" r="2"/><path d="M6 6v3a3 3 0 0 0 3 3h3m6-6v3a3 3 0 0 1-3 3h-3m0 0v6"/></svg>`,
    watch: `<svg xmlns="http://www.w3.org/2000/svg" class="${iconClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

projects.forEach((project) => {
    const button = document.createElement('button');
    button.className =
        'btn btn-ghost h-auto justify-start rounded-box border border-transparent px-3 py-3 text-left hover:border-primary/30 hover:bg-base-100';
    button.type = 'button';
    button.dataset.projectId = project.id;
    button.innerHTML = `
        ${
            project.icon
                ? `<img src="${project.icon}" alt="" class="rounded-box size-10 shrink-0 object-cover" data-project-icon />`
                : ''
        }
        <span class="flex min-w-0 w-full flex-col items-start gap-1">
            <span class="text-base font-semibold">${project.name}</span>
            <span class="line-clamp-2 text-xs font-normal leading-5 text-base-content/58">${project.summary}</span>
        </span>
    `;
    button.querySelector('[data-project-icon]')?.addEventListener('error', (event) => {
        event.currentTarget.hidden = true;
    });
    button.addEventListener('click', () => selectProject(project.id));
    elements.list.append(button);
});

showHomeStatsSkeleton();
loadHomeStats();

window.addEventListener('hashchange', handleRoute);

handleRoute();

function handleRoute() {
    const projectId = window.location.hash.replace('#', '');
    const project = projects.find((item) => item.id === projectId);

    if (project) {
        loadProject(project);
        return;
    }

    showHome();
}

function selectProject(projectId) {
    if (window.location.hash === `#${projectId}`) {
        handleRoute();
        return;
    }

    window.location.hash = projectId;
}

async function loadProject(project) {
    elements.home.classList.add('hidden');
    elements.panel.classList.remove('hidden');
    setActiveProject(project.id);
    elements.drawer.checked = false;
    elements.links.replaceChildren(...createProjectLinks(project));
    showProjectStatsSkeleton();
    loadProjectStats(project.id);
    setStatus();
    showReadmeSkeleton();

    try {
        const readme = await fetchReadme(project.id);
        const html = marked.parse(readme.markdown);
        renderReadme(rewriteRelativeUrls(html, project.id, readme.branch));
        setStatus();
    } catch (error) {
        hideReadmeToc();
        elements.readme.innerHTML = `
            <h2>${project.name}</h2>
            <p>${project.summary}</p>
            <p>The README could not be loaded right now. Use the GitHub link above to open the project directly.</p>
        `;
        setStatus('error', error.message || 'Unable to load README.');
    }
}

function showHome() {
    elements.home.classList.remove('hidden');
    elements.panel.classList.add('hidden');
    setActiveProject();
    elements.drawer.checked = false;
    elements.links.replaceChildren();
    elements.stats.replaceChildren();
    hideReadmeToc();
    elements.readme.innerHTML = '';
    setStatus();
}

function showReadmeSkeleton() {
    hideReadmeToc();
    elements.readme.innerHTML = `
        <div class="space-y-5" aria-label="Loading README">
            <div class="skeleton h-12 w-full max-w-xl"></div>
            <div class="space-y-3">
                <div class="skeleton h-4 w-full"></div>
                <div class="skeleton h-4 w-11/12"></div>
                <div class="skeleton h-4 w-4/5"></div>
            </div>
            <div class="skeleton h-8 w-full max-w-sm"></div>
            <div class="space-y-3">
                <div class="skeleton h-4 w-full"></div>
                <div class="skeleton h-4 w-10/12"></div>
                <div class="skeleton h-4 w-3/4"></div>
            </div>
        </div>
    `;
}

function renderReadme(html) {
    elements.readme.innerHTML = DOMPurify.sanitize(html);
    renderReadmeToc();
}

function renderReadmeToc() {
    const headings = [...elements.readme.querySelectorAll('h1, h2, h3')];
    const slugCounts = new Map();
    let skippedFirstTitle = false;
    const tocItems = headings
        .map((heading) => {
            const label = heading.textContent.trim();

            if (!label) {
                return null;
            }

            const baseSlug = slugify(label);
            const count = slugCounts.get(baseSlug) || 0;
            slugCounts.set(baseSlug, count + 1);
            heading.id = count ? `${baseSlug}-${count + 1}` : baseSlug;

            if (heading.tagName === 'H1' && !skippedFirstTitle) {
                skippedFirstTitle = true;
                return null;
            }

            return {
                id: heading.id,
                label,
                level: Number(heading.tagName.slice(1)),
            };
        })
        .filter(Boolean);

    if (!tocItems.length) {
        hideReadmeToc();
        return;
    }

    elements.toc.classList.remove('hidden');
    elements.toc.innerHTML = `
        <p class="mb-3 font-semibold text-base-content/80">Contents</p>
        <ol class="space-y-2">
            ${tocItems
                .map(
                    (item) => `
                        <li class="${item.level > 2 ? 'pl-4' : ''}">
                            <a class="hover:text-primary block leading-5 ${item.level === 2 ? 'font-semibold text-base-content/80' : ''}" href="#${item.id}">${escapeHtml(item.label)}</a>
                        </li>
                    `,
                )
                .join('')}
        </ol>
    `;

    elements.toc.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            document.querySelector(link.getAttribute('href'))?.scrollIntoView();
        });
    });
}

function hideReadmeToc() {
    elements.toc.classList.add('hidden');
    elements.toc.innerHTML = '';
}

function slugify(value) {
    const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    return slug || 'section';
}

function escapeHtml(value) {
    const span = document.createElement('span');
    span.textContent = value;
    return span.innerHTML;
}

async function loadHomeStats() {
    try {
        const repos = await Promise.all(projects.map((project) => fetchRepo(project.id)));
        const totals = repos.reduce(
            (result, repo) => ({
                stars: result.stars + repo.stargazers_count,
                forks: result.forks + repo.forks_count,
                watchers: result.watchers + repo.subscribers_count,
            }),
            { stars: 0, forks: 0, watchers: 0 },
        );
        const tags = getPopularTags(repos);

        renderHomeStats(totals, tags);
    } catch {
        renderHomeStats({ stars: 0, forks: 0, watchers: 0 }, []);
    }
}

async function fetchRepo(projectId) {
    const response = await fetch(`https://api.github.com/repos/${organization}/${projectId}`);

    if (!response.ok) {
        throw new Error(`GitHub stats unavailable for ${projectId}`);
    }

    return response.json();
}

function showHomeStatsSkeleton() {
    elements.homeStats.innerHTML = `
        ${createHomeStatSkeleton('Projects', projects.length)}
        ${createHomeStatSkeleton('Stars')}
        ${createHomeStatSkeleton('Watchers')}
        ${createHomeStatSkeleton('Forks')}
    `;
    elements.homeTags.innerHTML = `
        <span class="skeleton h-6 w-20"></span>
        <span class="skeleton h-6 w-24"></span>
        <span class="skeleton h-6 w-16"></span>
    `;
}

function createHomeStatSkeleton(label, value) {
    return `
        <div class="stat">
            <div class="stat-title">${label}</div>
            <div class="stat-value text-2xl">${value ?? '<span class="skeleton inline-block h-8 w-16"></span>'}</div>
        </div>
    `;
}

function renderHomeStats(totals, tags) {
    elements.homeStats.innerHTML = `
        ${createHomeStat('Projects', projects.length)}
        ${createHomeStat('Stars', totals.stars, icons.star)}
        ${createHomeStat('Watchers', totals.watchers, icons.watch)}
        ${createHomeStat('Forks', totals.forks, icons.fork)}
    `;

    elements.homeTags.innerHTML = tags.length
        ? tags.map((tag) => `<span class="badge badge-outline">${escapeHtml(tag)}</span>`).join('')
        : '<span class="text-base-content/50 text-sm">No popular tags yet</span>';
}

function createHomeStat(label, value, icon = '') {
    return `
        <div class="stat">
            <div class="stat-title">${label}</div>
            <div class="stat-value text-2xl">
                <span class="inline-flex items-center gap-2">${icon}${compactFormatter.format(value)}</span>
            </div>
        </div>
    `;
}

function getPopularTags(repos) {
    const tagCounts = new Map();

    repos
        .flatMap((repo) => repo.topics || [])
        .forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });

    return [...tagCounts.entries()]
        .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
        .slice(0, 8)
        .map(([tag]) => tag);
}

async function fetchReadme(projectId) {
    const branches = ['master'];

    for (const branch of branches) {
        const url = `https://raw.githubusercontent.com/${organization}/${projectId}/${branch}/README.md`;
        const response = await fetch(url, { cache: 'no-store' });

        if (response.ok) {
            return {
                branch,
                markdown: await response.text(),
            };
        }
    }

    throw new Error('README not found on the master branch.');
}

function createProjectLinks(project) {
    return [
        createLink('GitHub', project.github, 'btn-primary', icons.github),
        project.website
            ? createLink('Website', project.website, 'btn-accent', icons.website)
            : null,
        project.demo ? createLink('Demo', project.demo, 'btn-accent', icons.demo) : null,
        project.download
            ? createLink('Download', project.download, 'btn-accent', icons.download)
            : null,
    ].filter(Boolean);
}

function createLink(label, href, tone, icon) {
    const link = document.createElement('a');
    link.className = `btn btn-sm ${tone} gap-2`;
    link.href = href;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.innerHTML = `${icon}<span>${label}</span>`;
    return link;
}

function setStatus(type, message) {
    elements.status.className = 'alert mt-6 hidden';

    if (!type) {
        elements.status.textContent = '';
        return;
    }

    const tone = type === 'error' ? 'alert-warning' : 'alert-info';
    elements.status.className = `alert ${tone} mt-6`;
    elements.status.textContent = message;
}

function setActiveProject(projectId) {
    document.querySelectorAll('[data-project-id]').forEach((button) => {
        const isActive = button.dataset.projectId === projectId;
        button.classList.toggle('btn-active', isActive);
        button.classList.toggle('bg-base-100', isActive);
        button.classList.toggle('border-primary/50', isActive);
    });
}

async function loadProjectStats(projectId) {
    try {
        const repo = await fetchRepo(projectId);
        if (window.location.hash !== `#${projectId}`) {
            return;
        }

        showProjectStats(repo.stargazers_count, repo.forks_count, repo.subscribers_count);
    } catch {
        elements.stats.replaceChildren();
    }
}

function showProjectStats(stars, forks, watchers) {
    elements.stats.innerHTML = `
        <span class="inline-flex items-center gap-1">${icons.star}<span>${compactFormatter.format(stars)}</span></span>
        <span class="inline-flex items-center gap-1">${icons.fork}<span>${compactFormatter.format(forks)}</span></span>
        <span class="inline-flex items-center gap-1">${icons.watch}<span>${compactFormatter.format(watchers)}</span></span>
    `;
}

function showProjectStatsSkeleton() {
    elements.stats.innerHTML = `
        <span class="skeleton h-5 w-12"></span>
        <span class="skeleton h-5 w-12"></span>
        <span class="skeleton h-5 w-12"></span>
    `;
}

function rewriteRelativeUrls(html, projectId, branch) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const rawBase = `https://raw.githubusercontent.com/${organization}/${projectId}/${branch}/`;
    const repoBase = `https://github.com/${organization}/${projectId}/blob/${branch}/`;

    template.content.querySelectorAll('img[src], a[href]').forEach((node) => {
        const attribute = node.tagName === 'IMG' ? 'src' : 'href';
        const value = node.getAttribute(attribute);

        if (!value || /^(https?:|mailto:|#)/i.test(value)) {
            return;
        }

        node.setAttribute(
            attribute,
            new URL(value, node.tagName === 'IMG' ? rawBase : repoBase).href,
        );
    });

    return template.innerHTML;
}
