# Blog

Articles by Live Miracles, one Markdown file per post, named `YYYY-MM-DD-slug.md`.
They are written here first and can be republished elsewhere (for example dev.to,
with `canonical_url` pointing at the post on this site once it is published here).

Each post starts with front matter:

```yaml
---
title: The post title
date: 2026-10-21
tags: [bunryu, reliability]
summary: One sentence for lists and link previews.
image: images/name.jpg
imageAlt: What the image shows
draft: true
---
```

Write each paragraph and list item on a single line, with no hard wraps: Dev.to renders a single newline as a line break, so a wrapped post has to be unwrapped by hand before copying it there. `npm run format` (Prettier, `proseWrap: never` for the posts) joins wrapped lines for you.

`image` and `imageAlt` are optional: the image is shown above the post, on its card in the list and as the link preview.
Posts with `draft: true` are not built; set `draft: false` once the post has been reviewed. Before publishing a post that
quotes logs or incidents, redact stream keys, SRT passphrases, destination URLs and
customer or encoder IP addresses.

The site build turns each published post into `/blog/<slug>/`, lists it on `/blog/` and in the RSS feed at `/blog/feed.xml`. To preview, run `npm run dev` and open `/blog/` on the port it prints; it always includes drafts (`npm run build` leaves them out unless `BLOG_DRAFTS=1` is set). It rebuilds when you save a post, so refresh the page to see the change. Put images in `blog/images/` and write them as `![alt](images/name.webp)`; they are copied to `/blog/images/`. Screenshots and GIFs that already exist in a project's repo don't need to be copied or compressed: link them with their `https://raw.githubusercontent.com/live-miracles/<repo>/master/...` URL. Keep each image stored here under 100 KB so the repository stays quick to clone: WebP for screenshots and diagrams (animated WebP instead of GIF), and JPEG for the header image, because link previews and Dev.to handle JPEG everywhere. Make the header image 1000×420 or a multiple of it, since Dev.to crops its cover to that ratio.

Each article has a **Copy Markdown** button beside its GitHub edit link. It copies Dev.to front matter followed by the article body with absolute image and link URLs. The metadata includes the title, publication status, canonical article URL, summary as the description, up to four tags, and an absolute cover image URL when present. Published posts use `published: true`; draft previews use `published: false`. Paste into Dev.to’s Basic Markdown editor to use the front matter. Code examples remain unchanged. If clipboard access is unavailable, the button shows selectable Markdown for manual copying.
