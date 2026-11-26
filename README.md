# Code editor

[![Build and test](https://github.com/noldova-com/code-editor/actions/workflows/build-and-test.yml/badge.svg?branch=main)](https://github.com/noldova-com/code-editor/actions/workflows/build-and-test.yml)
[![npm](https://badgen.net/npm/v/@noldova/code.editor)](https://www.npmjs.com/package/@noldova/code.editor)
[![License: MIT](https://badgen.net/static/license/MIT/blue)](LICENSE)

The code editor is a module for Noldova apps: a text model with undo, a code view with search and syntax highlighting, a side-by-side and inline diff view, and a 3-way merge view.
It keeps a document of 1,000,000 lines responsive: an edit, a keypress and a scroll each stay within a frame.
It is built in Angular for apps on [Noldova Desktop](https://github.com/noldova-com/desktop), whose window runs Chromium, and styled with the tokens of `@noldova/ui.components.angular`.
Its diffs and merges come from [`@noldova/diff`](https://github.com/noldova-com/diff), which it installs from npm, pinned exactly.

| Package | Holds |
|---|---|
| `@noldova/code.editor` | The framework-free core: the text model, edits and undo, selections, search, the tokenizer contract, the language, highlighter and token type registries, the diff algorithm contract and background jobs. It runs in a page, a worker or Node. |
| `@noldova/code.editor.textmate` | Highlighting from TextMate grammars, through Shiki: its highlighter and 33 default languages, registered through `TextMateContribution`, each replaceable by a host. |
| `@noldova/code.editor.diff` | The framework-free comparison of two documents over a diff algorithm: changed lines and characters, unchanged regions, and changes kept in place while you type. |
| `@noldova/code.editor.merge` | The framework-free 3-way merge model over the core: per-conflict choices, undo, and conflict markers. |
| `@noldova/code.editor.angular` | The Angular views: `noldova-code-editor`, with its public decorations, folds and inserted rows, and a read-only `CodeTextComponent`, with the worker runner for background jobs. |
| `@noldova/code.editor.diff.angular` | The Angular diff view, `noldova-diff-editor`, side by side or inline, drawn with the code view's decorations. |
| `@noldova/code.editor.merge.angular` | The Angular merge view, `noldova-merge-editor`, drawn with the code view's decorations. |

Every package is below 1.0 for now, and its API may change from one version to the next.
To report a bug or ask for a change, open an issue in this repository, as the organization's [contributing guide](https://github.com/noldova-com/.github/blob/main/CONTRIBUTING.md) says.
Report a security problem privately, as its [security policy](https://github.com/noldova-com/.github/blob/main/SECURITY.md) says.

## Getting started

An Angular app installs the view packages it uses, pinned exactly; each brings the packages under it at the same version, and the diff and merge models bring `@noldova/diff`:

```bash
npm install --save-exact @noldova/code.editor.angular @noldova/code.editor.merge.angular
```

Its peers are Angular 22, RxJS 7, `@noldova/ui.components.angular` 0.0.20 or later, and `@noldova/context.core`, `@noldova/context.collections` and `@noldova/context.exceptions` 0.0.12 or later, below 0.1.0.

A merge view takes a base and two sides, and gives the result after every change:

```html
<noldova-merge-editor
  [base]="base" [ours]="ours" [theirs]="theirs"
  oursLabel="main" theirsLabel="feature"
  (resultChange)="result = $event" />
```

[documents/ARCHITECTURE.md](documents/ARCHITECTURE.md) describes each view, its inputs and outputs, and the text model.

## Building from source

The repository needs Node.js 26.13.1 and npm 11.20.0, as `package.json` says under `engines`.

```bash
npm ci
npm run build
npm test
```

`npm run build` builds the seven packages at the version `version.json` holds, each into its own folder in `_build/node`, packs each with `npm pack` into `_packages`, and installs the archives with `npm install --no-save`, so the tests use the packages as an app does and they never enter the manifest or the lockfile; it runs `npm ci --ignore-scripts` first when `node_modules` is missing.
The build writes the checkout's head commit into each package's `package.json` as `gitHead`, and fails before building when git can't read it.
`npm run build --silent -- --list-copies` builds nothing and prints each file the build copies into the packages, one per line, with tabs between its source, the package's name and its path inside the package, and then `end of copies`.
`npm test` compiles the core's, the merge model's and the scripts' tests, runs them, which are `@noldova/context.testing` test classes, against the installed core and merge packages with a 100% coverage gate, and prints its ten slowest tests with their times, which fail nothing; it then runs each Angular package's specs in Chromium, each with its own 100% coverage gate, which it installs through Playwright, as Angular's test builder runs them.
`npm test -- <filter>` runs only the core's, the merge model's and the scripts' tests whose package, file, class or method name holds the filter, without the coverage gate or the views' specs.
`npm run test:timing`, after `npm test`, is the timing check: it runs the built suite three times without coverage, takes each test file's median time, and fails a file over 2 seconds, or a listed file over the time the list gives it, each with a margin of 50%; this README lists no file slower than that.
The entry points live in `scripts/`, the same scripts as CONTEXT's.
Two options shorten `npm test`'s output, as the CI run uses them:

```bash
npm test -- --skip-test-details --skip-coverage-details
```

- `--skip-test-details` hides the line of each passing test; failures, skipped tests and the totals still print.
- `--skip-coverage-details` hides the coverage rows of fully covered files; files with gaps and the overall row still print.

The suite has one hang limit, 60 seconds, which `scripts/suite-script.ts` sets for every run of it; no test carries a limit of its own.

## Checks

Every pull request runs "Check / Linked issue", which needs the pull request to name the issue it resolves, and "Build and test", which builds and tests on Linux, Windows and macOS, each on x64 and arm64, as CONTEXT's does.
Build and test also checks that a second build packs the same archives, and that the archives pass the release's checks.

## Releases

The seven packages are published to npm together, at one version, by the "Release npm packages" workflow, `.github/workflows/release-npm.yml`, through npm's trusted publishing, so no token is stored, and a release never deletes a published version.
[CHANGELOG.md](CHANGELOG.md) says what each version changed.

## License

The code editor is licensed under the [MIT License](LICENSE).
Its third-party packages, such as Shiki's grammars, keep their own licenses, which their packages carry.

Angular, Chromium, Node.js, npm, Playwright, Shiki and the other product names used here are names of their owners.

## Trademarks

The code is under the MIT License, while the name "Noldova" and its logo are not: the MIT License grants no right to them.
A build from this code that is published by anyone but Noldova uses another name and its own logo.
