# Live Miracles

Website for the Live Miracles project directory: <https://live-miracles.github.io/>.

The home page lists every project by category, and each project gets a static
page at `/projects/<id>/` rendered from its README on `master`. Pages are plain
HTML, so search engines and link previews can read them; `sitemap.xml` and
`robots.txt` are generated too. Projects whose own repository serves an app on
GitHub Pages keep that URL (`/<repo>/`), which is why project pages live under
`/projects/`.

## Project documentation

A project can keep longer documentation in a `docs/` folder of Markdown files
and leave its README short. Each file becomes a page under
`/projects/<id>/docs/`, with a navigation menu, previous/next links and an
"Edit this page" link. Number prefixes set the order and are dropped from URLs,
and folders become menu sections:

```text
docs/
├── README.md                    # optional index -> /projects/<id>/docs/
├── 1-getting-started/
│   ├── 1-introduction.md       # -> /projects/<id>/docs/getting-started/introduction/
│   └── 2-install.md
└── 2-usage/
    └── 1-publishing.md
```

Each page's first `# Heading` is its title. Link between pages with normal
relative links (`../2-usage/1-publishing.md#section`); they work on GitHub and
are rewritten to site URLs here. See
[bunryu](https://github.com/live-miracles/bunryu/tree/master/docs)
for an example.

## Blog

Posts are Markdown files in `blog/`, named `YYYY-MM-DD-slug.md`, with front matter
(`title`, `date`, `summary`, `tags`, `draft`). Each published post gets a page at
`/blog/<slug>/`, and the site lists them at `/blog/` and in an RSS feed at
`/blog/feed.xml`. Posts with `draft: true` are not built (`BLOG_DRAFTS=1 npm run dev` previews them). See
[blog/README.md](blog/README.md) for the conventions.

To preview a project's README and docs from a local checkout before pushing:

```sh
LOCAL_PROJECTS=bunryu=../bunryu npm run build && npm run dev
```

## Adding a project

Add an entry to `scripts/projects.js` (the `id` is the repository name). The
README, stars, license and topics come from GitHub at build time. The publish
workflow also runs daily, so README changes in a project repository show up on
the site within a day.

## Development

Install dependencies:

```sh
npm install
```

Run the local preview:

```sh
npm run dev
```

Format source files:

```sh
npm run format
```

Build the static site (set `GITHUB_TOKEN` to avoid GitHub's unauthenticated
API rate limit):

```sh
GITHUB_TOKEN=$(gh auth token) npm run build
```

The build renders files into `dist/`. Generated CSS is not committed to this branch; the GitHub Actions workflow publishes the rendered site to the `gh-pages` branch.
