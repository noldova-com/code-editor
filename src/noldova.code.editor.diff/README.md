# @noldova/code.editor.diff

The code editor's framework-free comparison of two documents. `DocumentDiff` finds the changed lines, the changed characters inside each change, and the unchanged regions a view can fold. While a comparison runs, its last changes move through each edit, so the marks stay on their lines while a person types.
It edits nothing, has no DOM, and runs in a page, a worker or Node.
`@noldova/code.editor.diff.angular` shows it.
[documents/ARCHITECTURE.md](../../documents/ARCHITECTURE.md) says how its parts fit together.

## The algorithm

The line and character diffs come from an `IDiffAlgorithm`, which has two calls, `lines` and `characters`. `DefaultDiffAlgorithm`, over `@noldova/diff`, is the default. A host can give its own algorithm to `DocumentDiff`.

## Where the diff runs

Every comparison goes through an `IBackgroundRunner` from `@noldova/code.editor`, as a `LineDiffJob`.
- In the browser, `@noldova/code.editor.diff.angular`'s diff editor uses a worker. That is the default path, so the page never waits for the diff.
- Without a worker, as in tests and server rendering, the default `SlicedRunner` runs the job on the calling thread, a slice at a time. The slices fall around the algorithm's single `lines` call, not inside it, so one large diff still holds the thread for its whole time. noldova-com/diff#8 asks for a resumable diff that would let the slices reach inside the diff too.

A worker runs the default algorithm's job. For a host's own algorithm, its worker script must serve a `LineDiffJob` of that algorithm, or the job runs on the calling thread instead.

## Settings

The diff editor reads three settings for the diff and passes them in: `diff.contextLines`, the unchanged lines kept next to a change (3); `diff.minimumHiddenLines`, the fewest lines a fold hides (3); and `diff.characterDiffLimit`, the most characters of a change compared by character (20,000), which is `DocumentDiff.characterDiffLimit`.
