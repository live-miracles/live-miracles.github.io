const organization = 'live-miracles';

const projects = [
    {
        id: 'key-vault',
        name: 'Key Vault',
        summary:
            'A demo-focused secure key vault interface for storing and previewing secrets safely.',
        github: `https://github.com/${organization}/key-vault`,
        demo: `https://${organization}.github.io/key-vault/`,
    },
    {
        id: 'multi-lang-qa',
        name: 'Multi Lang QA',
        summary:
            'A multilingual question-and-answer workflow for teams handling live language support.',
        github: `https://github.com/${organization}/multi-lang-qa`,
        website: `https://${organization}.github.io/multi-lang-qa/`,
    },
    {
        id: 'vmix-master',
        name: 'vMix Master',
        summary: 'A web controller for coordinating multiple vMix systems during live production.',
        github: `https://github.com/${organization}/vmix-master`,
        website: `https://${organization}.github.io/vmix-master/`,
    },
    {
        id: 'live-gallery',
        name: 'Live Gallery',
        summary:
            'A gallery tool for live media workflows, previews, and stream-friendly visual organization.',
        github: `https://github.com/${organization}/live-gallery`,
        website: `https://${organization}.github.io/live-gallery/`,
    },
    {
        id: 'folder-player',
        name: 'Folder Player',
        summary:
            'A browser-based media player for folder-oriented playlists and lightweight playback.',
        github: `https://github.com/${organization}/folder-player`,
        download: `https://${organization}.github.io/folder-player/`,
    },
];

const elements = {
    list: document.querySelector('#project-list'),
    title: document.querySelector('#project-title'),
    eyebrow: document.querySelector('#project-eyebrow'),
    summary: document.querySelector('#project-summary'),
    links: document.querySelector('#project-links'),
    readme: document.querySelector('#readme'),
    status: document.querySelector('#status'),
    drawer: document.querySelector('#project-drawer'),
};

marked.setOptions({
    gfm: true,
    breaks: false,
});

projects.forEach((project) => {
    const button = document.createElement('button');
    button.className =
        'btn btn-ghost h-auto justify-start rounded-box border border-transparent px-3 py-3 text-left hover:border-primary/30 hover:bg-base-100';
    button.type = 'button';
    button.dataset.projectId = project.id;
    button.innerHTML = `
        <span class="flex w-full flex-col items-start gap-1">
            <span class="text-base font-semibold">${project.name}</span>
            <span class="line-clamp-2 text-xs font-normal leading-5 text-base-content/58">${project.summary}</span>
        </span>
    `;
    button.addEventListener('click', () => selectProject(project.id));
    elements.list.append(button);
});

window.addEventListener('hashchange', () => {
    const projectId = window.location.hash.replace('#', '');
    const project = projects.find((item) => item.id === projectId);

    if (project) {
        loadProject(project);
    }
});

const initialProject = projects.find(
    (project) => project.id === window.location.hash.replace('#', ''),
);

if (initialProject) {
    loadProject(initialProject);
}

function selectProject(projectId) {
    window.location.hash = projectId;

    const project = projects.find((item) => item.id === projectId);

    if (project) {
        loadProject(project);
    }
}

async function loadProject(project) {
    setActiveProject(project.id);
    elements.drawer.checked = false;
    elements.title.textContent = project.name;
    elements.eyebrow.textContent = project.id;
    elements.summary.textContent = '';
    elements.summary.classList.add('hidden');
    elements.links.replaceChildren(...createProjectLinks(project));
    setStatus('loading', `Loading ${project.name} README from GitHub...`);
    elements.readme.innerHTML = '';

    try {
        const readme = await fetchReadme(project.id);
        const html = marked.parse(readme.markdown);
        elements.readme.innerHTML = DOMPurify.sanitize(
            rewriteRelativeUrls(html, project.id, readme.branch),
        );
        setStatus();
    } catch (error) {
        elements.readme.innerHTML = `
            <h2>${project.name}</h2>
            <p>${project.summary}</p>
            <p>The README could not be loaded right now. Use the GitHub link above to open the project directly.</p>
        `;
        setStatus('error', error.message || 'Unable to load README.');
    }
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
        createLink('GitHub', project.github, 'btn-primary'),
        project.website ? createLink('Website', project.website, 'btn-secondary') : null,
        project.demo ? createLink('Demo', project.demo, 'btn-accent') : null,
        project.download ? createLink('Download', project.download, 'btn-accent') : null,
    ].filter(Boolean);
}

function createLink(label, href, tone) {
    const link = document.createElement('a');
    link.className = `btn btn-sm ${tone}`;
    link.href = href;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = label;
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
