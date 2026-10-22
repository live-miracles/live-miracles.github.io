---
name: write-blog-post
description: Write, illustrate and preview a Live Miracles blog post in blog/ (front matter, header image, inline images, size budget, Dev.to republishing). Use when the user asks for a blog post, article, a header or cover image for one, or to compress or fix blog images.
---

# Write a blog post

Posts are Markdown files in `blog/` of this repo, built into `/blog/<slug>/`, the
`/blog/` list and the RSS feed. [blog/README.md](../../blog/README.md) is the
reference for the file name, front matter and image conventions; this skill is
the workflow around it. Posts are written here first and republished on Dev.to
afterwards.

## 1. Write the post

- File: `blog/YYYY-MM-DD-slug.md`. The date in the front matter must equal the
  file name date, or the build skips the post with a warning.
- Start with `draft: true`; set `draft: false` only after the user has reviewed it.
- Tags: at most four (Dev.to's limit), lowercase.
- `summary` is one sentence and is used for the list, link previews and RSS.
- Do not repeat the title or date in the body; the page already shows them.
- Tone that worked for the incident post: a plain problem statement, a timeline of
  what really happened, what was changed and why, **what was not fixed**, and a
  few takeaways. Say what is still a risk instead of claiming it is solved.
- Every number comes from a source you can name (logs, a doc, a measurement).
  Never invent data, screenshots or quotes. A diagram of a real mechanism is fine.
- The repo is public. Before publishing anything that quotes logs or incidents,
  redact stream keys, passphrases, destination URLs and customer or encoder IPs
  (for Bunryu see its `write-fail-report` skill).

## 2. Images

Budget: **every image under 100 KB**, so the repository stays quick to clone (old
versions stay in history, so do not commit and recommit big files). Put them in
`blog/images/`, kebab-case names, and always write real alt text.

| Image                                                   | Format                 | Notes                                                                                                  |
| ------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Header image (`image:` and `imageAlt:` in front matter) | JPEG                   | Shown above the post, as a small thumbnail on the right of the `/blog/` card, and as the link preview. |
| Screenshot or diagram in the body                       | WebP                   | `![alt](images/name.webp)`                                                                             |
| Animation                                               | animated WebP, not GIF | See below.                                                                                             |

Shrink with the helper, which picks the highest quality that fits:

```sh
python3 -I skills/write-blog-post/optimize_image.py in.png blog/images/name.webp
python3 -I skills/write-blog-post/optimize_image.py cover.png blog/images/cover.jpg --width 1600
```

**Header image.**

- Dev.to crops its cover to 1000×420. Make it that ratio (for example 1600×672 or
  2000×840) or the sides are cut off.
- The site is dark, so use a dark background.
- It is shown about 220 px wide in the list, so it must work as a thumbnail: one
  big phrase or symbol, not small text. Do not repeat the post title.
- It must not be the same picture as an inline diagram; the diagram stays in the post.

**Diagrams.** Write an SVG (or HTML containing it) and render it with headless Chrome:

```sh
google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1600,740 --screenshot=out.png file://$PWD/diagram.html
```

Wrap text by hand (about 11 px per character at 22 px, so budget 18 to 20
characters per 240 px box) and open the PNG to check that nothing overflows or
overlaps; the first render usually does. Use `markerUnits="userSpaceOnUse"` on
arrowheads, or they scale with the stroke. A diagram that needs a title does not
need one inside the image, because the post has its own.

**Real screenshots.** Take them from a test or demo instance, never from
production. Bunryu has the `run-bunryu` skill for its dashboard. Crop to what the
text refers to.

**Animations.** Convert a screen recording or GIF to animated WebP at about 5
fps and 960 px wide:

```sh
ffmpeg -i in.gif -vf "fps=5,scale=960:-1:flags=lanczos" -c:v libwebp_anim \
  -lossless 0 -q:v 32 -compression_level 6 -loop 0 out.webp
```

WebP merges identical frames, so a mostly still recording ends up with few
frames; that is correct. Check the total duration matches the source rather than
the frame count (Pillow does not report animated WebP durations; read the `ANMF`
chunks). A 17 second dashboard recording came to about 100 KB this way, where
the GIF was 1.4 MB.

## 3. Preview and check

```sh
BLOG_DRAFTS=1 npm run dev     # drafts are visible at /blog/
npm run build                 # published posts only
npx prettier --check .
npm test
```

- Open the list page and the post, at desktop and phone width (headless Chrome
  `--window-size=1300,900` and `420,900` with `--screenshot=` is enough), and look at
  the result, not only the build output.
- `HTTP 403` warnings about other projects during the build are the GitHub API
  rate limit; they cut the page count but do not affect the blog.
- Other sessions may edit this repo at the same time. Run `git status` and read the
  diff before committing, and do not assume every change in it is yours.

## 4. Commit, publish, republish

- Commit locally in logical steps (post, images, build changes). Push only when
  the user asks.
- After the site deploys, republish on Dev.to with `canonical_url` set to
  `https://live-miracles.github.io/blog/<slug>/` and the cover set to the absolute
  URL of the header JPEG under `/blog/images/`. Check the preview there: Dev.to
  may not play animated WebP, and then that one image can be uploaded as a GIF.
