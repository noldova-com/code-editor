# @noldova/code.editor.merge

The code editor's framework-free 3-way merge model: `MergeDocument`, which builds a result from a base and two sides over `@noldova/diff`, or reads one from a file with conflict markers, and keeps each conflict's choice, state and undo; `MergeConflict`, `ConflictChoice`, `ConflictState` and `ConflictMarkersException`.
It edits through `@noldova/code.editor`'s text model, has no DOM, and runs in a page, a worker or Node.
`@noldova/code.editor.merge.angular` shows it.
[documents/ARCHITECTURE.md](../../documents/ARCHITECTURE.md) says how its parts fit together.
