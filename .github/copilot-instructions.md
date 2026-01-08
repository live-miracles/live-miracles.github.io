# AI Coding Guidelines for live-miracles.github.io

## Project Architecture

This repository hosts multiple live streaming tools as a GitHub Pages site with submodules. Key components:

- **Web Apps**: Vanilla JS applications (delayed-yt, gallery, vmix-master) served as static files
- **Chrome Extension**: gallery-ext bypasses CORS for enhanced video features
- **Google Apps Script**: API integrations (live-generator, gcp-monitor, multi-lang-qa) using OAuth2 library
- **Stable Versions**: /stable folder contains production-ready copies of main projects

## Development Workflow

- **Local Server**: Run `make` in root to start Express server on port 3000+ (auto-increments if taken)
- **Formatting**: `make pretty` in any project directory runs Prettier (ignores .min.js, output.css, stable/, v/)
- **CSS Build**: `make css` compiles Tailwind from input.css to output.css with watch mode
- **No Build Step**: Most projects are static HTML/JS served directly

## Code Patterns

### State Management

Use URL parameters for app state with `.url-param` class on inputs:

```javascript
// tools.js pattern - sync inputs with URL params
document.querySelectorAll('.url-param').forEach((input) => {
    const value = searchParams.get(input.id);
    if (value) setInputValue(input, value);
});
```

### Module Structure

- `tools.js`: Shared utilities (URL params, parsing, validation)
- `box.js` / `players.js`: Component-specific logic
- `script.js`: Main app initialization and event handlers

### Google Apps Script

- Use OAuth2 library (v43) for API authentication
- Store tokens in PropertiesService.getUserProperties()
- Enable advanced services in appsscript.json

### Chrome Extension

- Content scripts target specific video platforms (YouTube, JW Player, Facebook)
- Background service worker handles cross-origin communication
- Manifest v3 with host_permissions for video sites

## Integration Points

- **vMix API**: REST calls to control broadcast systems (vmix-api.js)
- **YouTube API**: OAuth-authenticated requests via Apps Script
- **Google Sheets**: Database for multi-lang-qa and other apps
- **CORS Bypass**: Extension injects scripts into embedded players

## Key Files

- [server.js](server.js): Express server with dynamic port allocation
- [Makefile](Makefile): Daemon management for dev server
- [.prettierignore](.prettierignore): Excludes minified files and stable versions
- [gallery/tools.js](gallery/tools.js): Core utility patterns
- [live-generator/YouTube.js](live-generator/YouTube.js): Apps Script OAuth example

## Maintainer Notes

_Individual maintainers may add their preferred workflows, contact information, or additional guidelines below this line._</content>
<parameter name="filePath">c:\Users\alexf\Documents\live-miracles.github.io\.github\copilot-instructions.md
