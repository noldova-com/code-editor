# @noldova/code.editor.angular

The code editor's views in Angular: `CodeEditorComponent`, the `noldova-code-editor` code view, and `CodeTextComponent`, a read-only code block.
Every edit, undo step, caret move and search goes through `@noldova/code.editor`'s core; the views render the lines in view and send input to it.
Each view takes a `language`, an id in the app's `CodeEditorRegistries` or a definition, and makes its tokenizer through the app's highlighters with `LanguageTokenizer`, showing the text plain until the tokenizer is ready.
The code view takes layers of decorations, `CodeDecorations` or any `ICodeDecorations`, each with line backgrounds, character ranges, gutter markers, inserted rows (`CodeBar`, `CodeSpacer`, `CodeEmbeddedLines`) and an optional second numbering; a later layer paints over an earlier one.
It also takes `CodeFold`s, which collapse to one row and keep a gutter toggle when expanded, and tells its owner of a toggle by `foldToggle` and of a bar's action by `barAction`.
`@noldova/code.editor.diff.angular`'s diff view is built on that API, and `@noldova/code.editor.merge.angular`'s merge view too.
They are styled only with the interface kit's tokens, so the page that shows them loads the kit's `kit.css` and `theme.css`, as the tests' page does.
The code view's element takes six custom properties, each with the kit's value when unset: `--nol-code-editor-font-size` and `--nol-code-editor-line-height` for its text, `--nol-code-editor-gutter-width` for the gutter's least width and `--nol-code-editor-gutter-end` for the space after its numbers, `--nol-code-editor-signs` set to `none` to hide the gutter's signs, and `--nol-code-editor-inset` for the space before the text; the merge view sets them on its panes.
`WorkerRunner` runs any package's background jobs in a web worker whose script serves them through the core's `WorkerJobHost`, importing no Angular, and runs a job the worker doesn't serve, or every job once the worker fails, on its fallback runner; `KeyScope`, which shares one key dispatcher between a view and the code views inside it, `LanguageTokenizer`, `LineIndex` and `BackgroundTicker` are the helpers other view packages build on.

[documents/ARCHITECTURE.md](../../documents/ARCHITECTURE.md) says how the views are built.
