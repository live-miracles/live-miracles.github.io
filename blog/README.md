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

`image` and `imageAlt` are optional: the image is shown above the post, on its card in the list and as the link preview.
Posts with `draft: true` are not built; set `draft: false` once the post has been reviewed. Before publishing a post that
quotes logs or incidents, redact stream keys, SRT passphrases, destination URLs and
customer or encoder IP addresses.

The site build turns each published post into `/blog/<slug>/`, lists it on `/blog/` and in the RSS feed at `/blog/feed.xml`. To preview, run `npm run dev` and open `/blog/` on the port it prints; set `BLOG_DRAFTS=1` to include drafts. Put images in `blog/images/` and write them as `![alt](images/name.webp)`; they are copied to `/blog/images/`. Keep each image under 100 KB so the repository stays quick to clone: WebP for screenshots and diagrams (animated WebP instead of GIF), and JPEG for the header image, because link previews and Dev.to handle JPEG everywhere. Make the header image 1000×420 or a multiple of it, since Dev.to crops its cover to that ratio.
