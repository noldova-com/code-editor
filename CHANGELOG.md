# Changelog

**Scope:** What each published version of the code editor's packages holds, newest first.

Each version's section is written by the pull request that changes the version, from the pull requests merged since the previous version; other pull requests don't edit this file.

## 0.0.2

The seven packages over CONTEXT 0.0.17; their own API doesn't change.

- Every package takes CONTEXT's packages as peers from 0.0.17, `>=0.0.17 <0.1.0`, and the core, the diff model and the Angular package take `@noldova/context.threading` from 0.0.17 too, so an app installs CONTEXT 0.0.17 or later, below 0.1.0.

## 0.0.1

The first published version of the code editor's seven packages, released together at one version, over `@noldova/diff` 0.0.2.
The core, the diff model and the Angular package take `@noldova/context.threading` as a peer, beside the other CONTEXT packages.

- `@noldova/code.editor`: a chunked text model that opens and edits 1,000,000-line documents, transactions with grouped undo and redo, multiple selections, incremental search with replace, `LineSplit`, the tokenizer contract, the language, highlighter and token type registries, the diff algorithm contract, and background jobs whose runners, `IBackgroundRunner` and `SlicedRunner`, cancel through `@noldova/context.threading`'s `CancellationToken`: `runAsync` takes a `cancellationToken`, and a canceled run rejects with an `OperationCanceledException`; for a page, a worker or Node.
- `@noldova/code.editor.textmate`: highlighting from TextMate grammars through Shiki, with a tokenizer that resumes from each line's state and 33 default languages, registered through `TextMateContribution`, each replaceable by a host.
- `@noldova/code.editor.diff`: the comparison of two documents over `@noldova/diff`: changed lines and characters, unchanged regions, and changes kept in place while you type; disposing it cancels the diff still running.
- `@noldova/code.editor.merge`: the 3-way merge model, with per-conflict choices, undo, and files with conflict markers.
- `@noldova/code.editor.angular`: the code view, with search, highlighting, drag and drop and IME input, and a public decorations API of line backgrounds, character ranges, gutter markers, a closed set of inserted rows and folds, drawn in layers, with fold keys and six public custom properties for its type and gutter; a read-only code block; and `WorkerRunner`, which runs background jobs in a web worker and cancels through the same `CancellationToken`.
- `@noldova/code.editor.diff.angular`: the diff view, side by side or inline, diffing in a worker over 100,000 lines, with collapsible unchanged regions, drawn with the code view's decorations.
- `@noldova/code.editor.merge.angular`: the 3-way merge view, with per-conflict choices, merged files with conflict markers, and projected heads, drawn with the code view's decorations.
