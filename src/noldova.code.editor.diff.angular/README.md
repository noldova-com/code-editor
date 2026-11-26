# @noldova/code.editor.diff.angular

The code editor's diff view in Angular: `DiffEditorComponent`, the `noldova-diff-editor` view of a `@noldova/code.editor.diff` `DocumentDiff`, side by side, inline, or side by side until the view is narrower than its breakpoint.
It colors both texts by its `language`, an id or a definition, as the code view does, shows the changed lines and characters, folds the unchanged regions, keeps the modified side editable unless it is read-only and the original read-only unless asked, and moves between changes with the `diffEditor.nextChange` and `diffEditor.previousChange` commands, on Alt with Down and Up, or `nextChange` and `previousChange`.
Its `DiffEditorContribution` adds those commands, their keys, the `inDiffEditor` condition and the `DiffEditorSettings` to the app's `CodeEditorRegistries`: `diff.contextLines`, the unchanged lines kept next to a change; `diff.minimumHiddenLines`, the fewest lines a fold hides; `diff.characterDiffLimit`, the most characters compared by character; and `diff.inlineBreakpoint`, the width in rem below which the automatic layout is inline.
A host sets them, and rebinds the keys, in `CodeEditorRegistries` like any other setting or key.
It draws on `@noldova/code.editor.angular`'s code view through its public decorations, and is styled only with the interface kit's tokens.

## The worker

`DiffWorker.create()` starts a worker that runs the default algorithm's line diff, as a `WorkerRunner` to give to `DocumentDiff`.
In the browser that worker is the default path, so the page never waits for a diff; the app's build sets `webWorkerTsConfig` to bundle `diff.worker.ts`, as this package's `angular.json` does with `tsconfig.worker.json`.
Without a worker the diff runs a slice at a time on the page, and its one call to the algorithm holds the page for its whole time, as `@noldova/code.editor.diff`'s README says.

[documents/ARCHITECTURE.md](../../documents/ARCHITECTURE.md) says how the view is built.
