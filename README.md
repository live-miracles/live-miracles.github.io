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
are rewritten to site URLs here. `docs/adr/` and `docs/agents/` (decision records
and coding-agent notes) are not published; links to them from other pages point
at GitHub instead. See
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
LOCAL_PROJECTS=bunryu=../bunryu npm run dev
```

## Adding a project

Add an entry to `scripts/projects.js` (the `id` is the repository name). The
README, stars, license and topics come from GitHub at build time. The publish
workflow also runs daily, so README changes in a project repository show up on
the site within a day.

## Link-preview images

The card shown when a page is shared is `ui/assets/social/<name>.png` (1280×640, the
size GitHub's social preview also wants): `home.png` for the home page and
`<project id>.png` for a project's page and its docs. A project without one uses
the first screenshot in its README. The projects keep no copy: upload the same file
under Settings → Social preview of the project's repository (GitHub offers no API
for it).

## Look and artwork

The palette and the motifs come from Hokusai's sea and from Japanese textile patterns. The
hero backdrop is `ui/assets/waves.avif`, the dark ukiyo-e wave nightscape that
[Live Gallery](https://github.com/live-miracles/live-gallery) shows in its empty boxes (about
40 KB); by day it is inverted into pale paper.

Each category in `scripts/projects.js` has a `tint` and a `pattern` (`seigaiha` waves,
`asanoha` hemp leaf, `shippo` interlocking circles, `kikko` tortoiseshell). The patterns are
small SVG masks in `ui/assets/patterns/` (white lines on black, read by luminance), filled with
the tint in CSS, so one file serves every category and both colour schemes. A category's band
on the home page and its project pages show its pattern; the footer uses seigaiha.

Glows are placed per page: `glowVars()` in `scripts/build.js` derives their positions from the
page's name, so each page glows from its own spot, the same one on every visit and build.

Colours follow the visitor's light or dark setting until they press the sun or moon button in
the top bar, which remembers their choice (see the tokens at the top of `ui/styles.css`, kept
twice: for the system setting and for a chosen dark theme).

## Development

Install dependencies:

```sh
npm install
```

Run the local preview:

```sh
npm run dev
```

It builds the site, serves `dist/` and rebuilds about a second after you save a
file in `blog/`, `ui/` or `scripts/` (or the README and `docs/` of a
`LOCAL_PROJECTS` checkout). The browser does not reload by itself: refresh it
after the "Rebuilt" line. GitHub data is fetched once per run and reused, so
restart to refresh it.

Format source files:

```sh
npm run format
```

Build the static site (set `GITHUB_TOKEN` to avoid GitHub's unauthenticated
API rate limit):

```sh
GITHUB_TOKEN=$(gh auth token) npm run build
```

The build renders files into `dist/`, building aside and swapping the finished site in, so a failed build leaves the previous `dist/` in place. It also runs Tailwind, so `npm run build` is the only step. Generated CSS is not committed to this branch; the GitHub Actions workflow publishes the rendered site to the `gh-pages` branch.
