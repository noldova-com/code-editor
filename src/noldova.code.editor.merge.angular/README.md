# @noldova/code.editor.merge.angular

The code editor's merge view in Angular: `MergeEditorComponent`, the `noldova-merge-editor` 3-way merge view, with ours and theirs side by side over the result, each conflict's choices, and `ActiveConflict`, the conflict at the caret.
It draws its conflicts with `@noldova/code.editor.angular`'s public decorations, and every choice and edit goes through `@noldova/code.editor.merge`'s `MergeDocument`.
It is styled only with the interface kit's tokens, so the page that shows it loads the kit's `kit.css` and `theme.css`, as the tests' page does.

[documents/ARCHITECTURE.md](../../documents/ARCHITECTURE.md) says how the views are built.
