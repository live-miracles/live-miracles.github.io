// The project directory. Each project gets a static page at /projects/<id>/
// built from its README on the master branch. `id` must match the repository
// name. Repositories that host their own app on GitHub Pages already own
// /<id>/, which is why project pages live under /projects/.

const organization = 'live-miracles';
const pages = `https://${organization}.github.io`;

const categories = [
    {
        id: 'streaming',
        tint: '#2f6fb3',
        pattern: 'seigaiha',
        name: 'Streaming & transport',
        summary: 'Ingest, forward and watch live streams reliably.',
    },
    {
        id: 'vmix',
        tint: '#d9694f',
        pattern: 'asanoha',
        name: 'vMix production',
        summary: 'Control and automate vMix systems during live shows.',
    },
    {
        id: 'monitoring',
        tint: '#2a9d8f',
        pattern: 'shippo',
        name: 'Monitoring & operations',
        summary: 'Keep an eye on many feeds and machines at once.',
    },
    {
        id: 'events',
        tint: '#d4a24c',
        pattern: 'kikko',
        name: 'Event workflows',
        summary: 'Google Workspace tools for scheduling, stream keys and audience Q&A.',
    },
];

const projects = [
    {
        id: 'bunryu',
        name: 'Bunryu',
        category: 'streaming',
        summary:
            'Bunryu (分流, "branching flow"): self-hosted restreaming server. RTMP, SRT and bonded SRT inputs forwarded to many RTMP/SRT destinations, with watchdogs and translation audio mixing.',
        icon: '/assets/bunryu-logo.png',
    },
    {
        id: 'goryu',
        name: 'Goryu',
        category: 'streaming',
        summary:
            'Goryu (合流, "confluence"): standalone SRT relay that accepts bonded or redundant SRT groups, or a plain SRT link, and forwards one deduplicated stream downstream.',
        icon: '/assets/goryu-logo.png',
    },
    {
        id: 'delayed-yt',
        name: 'Delayed YouTube',
        category: 'streaming',
        summary:
            'Watch a YouTube live stream at a fixed delay, and keep it there when the player jumps back to live.',
        icon: `${pages}/delayed-yt/logo.png`,
        website: `${pages}/delayed-yt/`,
    },
    {
        id: 'vmix-master',
        name: 'vMix Master',
        category: 'vmix',
        summary:
            'Run several vMix systems as one from a browser: group control, slave scripts, setup checks and translator ducking.',
        icon: `${pages}/vmix-master/logo.svg`,
        website: `${pages}/vmix-master/`,
    },
    {
        id: 'folder-player',
        name: 'vMix Folder Player',
        category: 'vmix',
        summary:
            'Turn a folder of numbered media files into a vMix playlist, with a simple web UI for operators.',
        icon: '/assets/folder-player-logo.png',
        download: `https://github.com/${organization}/folder-player/releases`,
    },
    {
        id: 'live-gallery',
        name: 'Live Gallery',
        category: 'monitoring',
        summary:
            'Multiviewer for monitoring many live streams at once: YouTube, JW Player, HLS, custom URLs and screen shares, with audio meters, solo/rotate audio and alerts for frozen video, silence and phase problems.',
        icon: '/assets/live-gallery-logo.png',
        download: `https://github.com/${organization}/live-gallery/releases`,
    },
    {
        id: 'wake-up-support',
        name: 'Wake Up Support',
        category: 'monitoring',
        summary: 'Small Windows app that wakes machines on the local network with Wake-on-LAN.',
        download: `https://github.com/${organization}/wake-up-support/releases`,
    },
    {
        id: 'key-vault',
        name: 'Key Vault',
        category: 'events',
        summary:
            'A safer way to store and share stream keys for big events, with role-based access, on Google Apps Script.',
        icon: `${pages}/key-vault/logo.png`,
        demo: `${pages}/key-vault/`,
    },
    {
        id: 'live-generator',
        name: 'Live Generator',
        category: 'events',
        summary:
            'Google Sheets extension that schedules YouTube live events in bulk from rows of stream settings.',
    },
    {
        id: 'multi-lang-qa',
        name: 'Multi Lang QA',
        category: 'events',
        summary:
            'Collect audience questions with translations during a live session; the host stars and completes them.',
        icon: `${pages}/multi-lang-qa/logo.png`,
        demo: `${pages}/multi-lang-qa/`,
    },
];

module.exports = { organization, categories, projects };
