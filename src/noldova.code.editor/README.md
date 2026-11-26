# @noldova/code.editor

The code editor's framework-free core: a text model with transactions and grouped undo, search, tokenizing, the editing session, the diff algorithm contract, background jobs with a sliced runner and a worker job host, and `LineSplit`, a text's lines with their breaks, that the views in `@noldova/code.editor.angular`, the diff model in `@noldova/code.editor.diff` and the merge model in `@noldova/code.editor.merge` use.
It has no DOM, so it runs in a page, a worker or Node.
[documents/ARCHITECTURE.md](../../documents/ARCHITECTURE.md) says how its parts fit together.
