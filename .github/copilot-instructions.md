# Copilot instructions for FTUI

## Project shape

FTUI is a static Web Components UI for FHEM and Home Assistant. The deployable application is the `www/ftui` tree; it is served directly by FHEMWEB, a local web server, or the nginx image built by `Dockerfile`. There is no application build step or package-manager script at the repository root.

The browser entry point is `www/ftui/index.html`, which loads `ftui.js`. That bootstrap dynamically imports `modules/ftui/ftui.app.js`. `FtuiApp` reads page `<meta>` configuration, initializes `backend.service.js`, discovers undefined `ftui-*` elements, dynamically imports their component modules, and starts `FtuiBinding`. Backend traffic is routed through `backend.service.js` to either `fhem.service.js` or `ha.service.js`; FHEM uses HTTP/WebSocket updates and Home Assistant is selected by `ha:` bindings and configured credentials.

Components live in `www/ftui/components/<component>/`. A component normally extends `FtuiElement` (or another FTUI component), declares properties and a template, registers itself with `customElements.define`, and keeps its component CSS beside its JavaScript. Shared runtime code is under `www/ftui/modules/`; examples are under `www/ftui/examples/`. `config.local.js` is intentionally ignored and is dynamically merged over `config.js` for local backend configuration.

## Build, run, lint, and test

- Build and run the local Docker image: `docker compose up -d`
- Stop the local container: `docker compose down`
- The compose service exposes the UI at `http://localhost:8080` and mounts the working tree's `www/ftui/index.html` into the container for local customization.
- There is no repository-managed automated test runner. Browser fixtures are in `www/ftui/tests/`; when using the documented FHEM development symlink, open an individual fixture such as `http://<fhem-host>:8083/fhem/ftui_dev/tests/label.html`. Use `ftui-snippet-tester.html` for quick component/markup checks.
- There is no root `package.json` or configured lint script. `.eslintrc.json` is the repository ESLint configuration; if ESLint is available in the environment, lint changed JavaScript with `eslint path/to/file.js` (or `eslint 'www/ftui/**/*.js'` for the tree). Do not treat vendored code under `www/ftui/extras/ionic` as FTUI source.
- Enable the repository hooks once with `git config core.hooksPath .githooks`. The pre-commit hook runs `bash prepare_update.sh` and stages `controls_ftui.txt`; the post-commit hook adds the final commit subject to `CHANGED` in the same commit; the pre-push hook rejects a push when generated data is stale.

For FHEM-based development, link the source tree with `ln -s $HOME/ftui/www/ftui /opt/fhem/www/ftui_dev`, then use the FHEM-hosted URLs. For Home Assistant, use an ignored `www/ftui/config.local.js` containing `homeAssistant.enabled`, `url`, and `token`; never commit a real token.

## Implementation conventions

- Preserve the browser compatibility baseline from the FTUI agent configuration: JavaScript must parse and run in Chrome 71. Avoid optional chaining, nullish coalescing, logical assignment, class/private fields, numeric separators, `for await...of`, and newer APIs such as `Object.fromEntries`, `Array.prototype.flat`, `replaceAll`, or `Promise.allSettled` unless an existing polyfill clearly covers them.
- Component modules are loaded from the element name using the path convention `components/<second-and-optional-third-name-part>/<name>.component.js`; keep folder, file, and custom-element names aligned so `FtuiApp.loadUndefinedComponents()` can find them.
- Use `FtuiElement` property definitions and its kebab-case conversion rather than creating parallel attribute/property plumbing. New public component attribute names should follow the FTUI agent convention: one word, lowercase, and without underscores. Preserve established names when modifying existing components unless the change explicitly migrates the public API.
- Register every new custom element with `window.customElements.define(...)` (or the existing equivalent) in its component module. Use the existing lifecycle hooks (`onConnected`, `onAttributeChanged`) and binding/event helpers instead of bypassing the component base class.
- Binding syntax is part of the public API: `[attribute]` is backend-to-UI input, `(attribute)` is UI-to-backend output, `[(attribute)]` is two-way, `@event` evaluates an event handler, and `get-`/`set-`/`gset-` are supported aliases. Pipes are parsed by `FtuiBinding`; reuse the existing helpers when adding transforms.
- Public Home Assistant bindings use the `ha:` prefix in HTML. Backend internals use the corresponding `ha-` routing form; route through `backend.service.js` rather than calling a backend service directly from generic component code.
- Keep user configuration in `config.local.js`, not `config.js`, when it is environment-specific. `config.js` must remain safe as the checked-in default and must continue to tolerate a missing local config.
- Keep source changes in `www/ftui`; generated `controls_ftui.txt` is the FHEM updater manifest and should be regenerated by the hooks rather than hand-maintained.