# Live Miracles

Single-page website for the Live Miracles project directory.

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

Build the static site:

```sh
npm run build
```

The build renders files into `dist/`. Generated CSS is not committed to this branch; the GitHub Actions workflow publishes the rendered site to the `gh-pages` branch.
