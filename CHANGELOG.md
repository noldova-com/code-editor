# Changelog

**Scope:** What each published version of the code editor's packages holds, newest first.

Each version's section is written by the pull request that changes the version, from the pull requests merged since the previous version; other pull requests don't edit this file.

## 0.0.1

The first published version of `@noldova/code.editor`, `@noldova/code.editor.merge`, `@noldova/code.editor.angular` and `@noldova/code.editor.merge.angular`, over `@noldova/diff` 0.0.1.

- `@noldova/code.editor`: a chunked text model that opens and edits 1,000,000-line documents, transactions with grouped undo and redo, multiple selections, incremental search with replace, the diff model, `LineSplit`, and a tokenizer over Shiki's grammars that resumes from each line's state.
- `@noldova/code.editor.merge`: the 3-way merge model, with per-conflict choices, undo, and files with conflict markers.
- `@noldova/code.editor.angular`: the code view, with search, highlighting, drag and drop and IME input, and a public decorations API of line backgrounds, character ranges, gutter markers, a closed set of inserted rows and folds, drawn in layers, with fold keys and six public custom properties for its type and gutter; the diff view, side by side or inline, diffing in a worker over 100,000 lines, with collapsible unchanged regions; and a read-only code block.
- `@noldova/code.editor.merge.angular`: the 3-way merge view, with per-conflict choices, merged files with conflict markers, and projected heads, drawn with the code view's decorations.
