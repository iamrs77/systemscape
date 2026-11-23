# 7. Pages in the URL's hash

- **Status:** Accepted
- **Date:** 2026-11-23

## Context

With more systems coming, the app needs a home page to choose one from, and each system needs its own link to share, bookmark and come back to with the back button.

The site is static and built with relative paths, so it runs from any folder on any host ([ADR 0001](0001-static-site.md)). Paths like `/ride-hailing` would need the host to send every path to `index.html`, which each host configures differently, and some (GitHub Pages) can't without workarounds. A refresh on a system's page would otherwise be a 404.

## Decision

Keep the page in the URL's hash: `#/` is the home page, `#/ride-hailing` is a system. `src/route.ts` reads it (anything that isn't a known system is the home page) and re-renders when it changes. Links are plain `<a href="#/...">`, so opening in a new tab, copying the link and the back button work without any code. No router library: two kinds of page don't need one.

## Consequences

- Works on every static host, from any folder, with nothing to configure.
- The links look a little less clean (`/#/ride-hailing`), and the hash can't be used to jump to a heading.
- If pages ever need their own titles and previews when shared (search engines and link previews don't run the app), they'd need real paths and a pre-rendered page each.
