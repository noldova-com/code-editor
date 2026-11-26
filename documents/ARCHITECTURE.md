# Code editor architecture

**Scope:** What the code editor is, its packages and their boundaries, the text model, the views, and the decisions behind them.

## What it is

The code editor is a module for Noldova apps: a text model with undo, a code view, a diff view and a 3-way merge view, for apps on Noldova Desktop.
It is its own repository with its own packages and version, beside the kit, `@noldova/ui.components.angular`, which keeps its light code block and diff view for read-only use.
It is built on CONTEXT, Noldova's base framework (`@noldova/context.*`), and on `@noldova/diff`, Noldova's diff package from its own repository, and on no other editor.
Its first user is a Git client's merge view.

## Packages

| Package | Holds | Depends on |
|---|---|---|
| `@noldova/code.editor` | The framework-free core: the text model, edits and undo, positions and selections, search, the registries, among them the language, highlighter and token type registries, `LineSplit`, the tokenizer contract, with no highlighter of its own, the diff algorithm contract, and background jobs with the sliced runner and the worker side of the worker runner. It runs in a page, a worker or Node. | CONTEXT |
| `@noldova/code.editor.textmate` | Highlighting from TextMate grammars, through Shiki: `TextMateHighlighter`, `TextMateTokenizer` and its state, the scope rules onto token types, and the 33 default languages, registered through `TextMateContribution`. All of Shiki's code and types are here. | `@noldova/code.editor`, Shiki, pinned exactly, CONTEXT |
| `@noldova/code.editor.diff` | The framework-free diff model: `DocumentDiff`, its changes, character ranges and unchanged regions, and the line diff job, over a diff algorithm whose default is `@noldova/diff`'s. | `@noldova/code.editor`, `@noldova/diff` from npm, pinned exactly, CONTEXT |
| `@noldova/code.editor.merge` | The framework-free 3-way merge model: `MergeDocument`, its conflicts, choices and states, and conflict markers. | `@noldova/code.editor`, `@noldova/diff`, CONTEXT |
| `@noldova/code.editor.angular` | The code view, with its public decorations API and the find bar, as Angular components styled only with the kit's tokens, and the page side of the worker runner for any package's background jobs. | `@noldova/code.editor`, the kit, Angular |
| `@noldova/code.editor.diff.angular` | The diff view and its worker, drawn with the code view's public decorations, with its commands, keys and settings in the registries. | `@noldova/code.editor`, `@noldova/code.editor.diff`, `@noldova/code.editor.angular`, the kit, Angular |
| `@noldova/code.editor.merge.angular` | The merge view, drawn with the code view's public decorations. | `@noldova/code.editor`, `@noldova/code.editor.merge`, `@noldova/code.editor.angular`, the kit, Angular |

The core and the diff and merge models hold no DOM, so their tests run in Node and their models can move into a worker.
The core exports only what an app or the merge model uses, and the merge model reaches it only through that API; the code view knows nothing of diffs' or merges' meaning, and the diff and merge views express theirs through its decorations.
A view holds no text rules of its own: every edit, undo step, search and merge choice goes through the core.

The build is CONTEXT's, `scripts/build.ts` with the scripts beside it, with `scripts/config.ts` naming the seven packages in the order they build: the core, the TextMate highlighter, the diff model, the merge model, the code view, the diff view and the merge view.
`npm run build` builds the core first: it compiles `src/noldova.code.editor/src` with TypeScript into `_build/node/noldova.code.editor`, beside a copy of the handwritten declarations `src/api/index.d.ts`, the package's README and the repository's LICENSE; the TextMate highlighter and the diff and merge models build the same way, once the core is installed, since the build installs the packages a package's `dependencies` and `peerDependencies` name before it builds that package.
The code view's package has its own `scripts/build.ts`, which the diff and merge views' packages use too, and which the build runs in place of TypeScript once the packages before it are installed: it compiles `api/index.ts` and the workers with the Angular compiler in partial compilation, which an app links when it builds, into `_build/node/<package>`, names each relative import with its `.js` file, workers' `new URL` included, and fails when a built file names one Node.js can't load.
It then runs its `scripts/carry-docs.ts`, which puts the JSDoc of the package's handwritten `src/api/index.d.ts` above each matching export and public member of the declarations the Angular compiler wrote, and fails, naming each one, when an export or member is in one and not the other, has a different number of declarations or has no JSDoc; an export the entry takes from another package keeps that package's declarations and is not compared, and `--list-copies` lists only the README for these two packages.
The compiler strips members marked `@internal`, such as the inserted rows' row-building, and the build fails when a built declaration file still holds one: `BuildTests.shipsTheAngularPackagesDeclarationsWithoutTheirInternalMembers`.
A built declaration file of an Angular package that names `Disposable` or `Symbol.dispose` starts with a reference to TypeScript's `esnext.disposable` library, so an app type-checks the package without adding that library itself.
Each package's manifest is written from its source `package.json` with `__VERSION__` set to the version `version.json` holds and the checkout's commit as `gitHead`, packed with `npm pack` into `_packages`, and installed at the root with `npm install --no-save`.
Each manifest's entry is `api/index.js`, with `api/index.d.ts`; each package depends on the packages under it at that same version, and the Angular packages take as peers the kit, `>=0.0.35 <0.1.0`, and Angular and RxJS, from the version the root pins up to the next major, such as `>=22.3.0 <23.0.0`, so an app loads its own copy of each.
The TextMate package pins Shiki exactly, the diff and merge models `@noldova/diff`, and every package takes CONTEXT's packages as peers, `>=0.0.17 <0.1.0`, `@noldova/context.threading` only the core, the diff model and the Angular package, which import it; `npm run build --silent -- --list-copies` lists the files the build copies into the packages and builds nothing.

## Registries

Every list a module, a host or a user may change is a registry in the core, and the core's own entries register through the same calls as anyone's.
An app keeps one `EditorRegistries`, the code view's `CodeEditorRegistries`, and each editor takes a child set whose entries add to the app's and win over them for the same id; a contribution, a package's `{ id, contribute }`, is added once per id across a set and its parents.

- Commands are registered by a dotted id and run by it, with optional arguments, against a `CommandContext`: the registries, the editor's condition values, its parts as typed `EditorFeature` slots such as the session, its language, the input's time and the page size.
  Registering an id the same registry holds throws `RegistrationExistsException`, and running an id no registry holds throws `RegistrationMissingException` and runs nothing else.
  A command returns false when it doesn't apply, and the key goes on to the next binding.
  Each built-in command is a typed member declared once, such as `CoreCommands.cursorWordLeft`, with a move's `Select` twin as its `select`; bindings, other packages and tests refer to the member, never to its id's text, as settings do with `CoreSettings`.
- Key bindings are data, `{ key, command, args, when }`, as text of modifiers and a key joined by `+`, such as `ctrl+shift+k`, with `mod` for Cmd on Mac and Ctrl elsewhere; a key that differs by platform is a rule per platform, told apart by the `platform` condition, `mac`, `windows` or `linux`, which the core reads from the runtime and a host may set; a key matches by its `key` name, by its `code` name such as `BracketLeft`, or, for a letter or digit the layout gives no plain character for, by its physical key.
- A key may be a sequence of two chords separated by a space, such as `ctrl+k ctrl+c`: one `KeyDispatcher` serves a view and the code views inside it, shared through the Angular package's `KeyScope`, so each press in a diff or merge view's pane goes through the pane's bindings and then its host's; it waits after a sequence's first chord, which wins over a single-chord binding on the same key, ignores a modifier key alone while it waits, runs the binding the next chord completes, and drops the sequence, using up the press, on any other key, Escape too; the code view drops it on a click or the loss of the focus too, and tells its owner the pending chord as the platform shows it, such as `⌘K` or `Ctrl+K`, through `keySequencePending`, which the diff and merge views give too. The most chords a sequence may have is a number in the core's resources.
  The user's rules come first, then each package's defaults, the last-added first; a user rule `-command` removes that command's defaults on the key it names, or on every key.
- Conditions are named facts, declared with a default, that a binding's `when` tests with `!`, `&&`, `||`, `==`, `!=` and parentheses; a name nothing set reads as its default, or false.
  A package's default bindings build their `when` from the typed keys, with `Condition.has`, `Condition.equals` and `Condition.notEquals`, or `CoreConditions.onMac` and `offMac`; a user's rule gives it as text, which `Condition.parse` reads.
- Settings are declared with a default and the values they accept, and read a language's user value, then a language's default, then the user's value, then the default, skipping values they don't accept; per-language values sit under `"[languageId]"`.
  The core declares `editor.indentSize`, 2, `editor.insertSpaces`, true, `editor.undoGroupMilliseconds`, 500, and `editor.undoLimit`, 10,000.
- Phrases are text by key and locale, looked up in the locale, its language, then English, with `{name}` values and plural forms through `Intl.PluralRules`.
- Languages, highlighters and token types register by id the same way, a child set's before its parent's; the core's contribution registers the built-in token types and modifiers, and the TextMate package's contribution its languages, highlighter and language defaults, as the code view's highlighting below says.
- Diff algorithms are registered by id, `IDiffAlgorithm`'s two calls `lines` and `characters`; `diffAlgorithms.current(id)` gives the one a setting names, or the last registered, and the diff model's `DiffContribution` registers `@noldova/diff`'s as `noldova.diff`.
- Background jobs, `IBackgroundJob`'s named generators of steps, are registered by name; the diff model's contribution registers its `LineDiffJob`.
  A runner runs them: the core's `SlicedRunner` on the page in time slices, or the Angular package's `WorkerRunner` in a web worker.
  A run stops through CONTEXT's cancellation, from `@noldova/context.threading`, never the platform's `AbortSignal`: `runAsync` takes a `CancellationToken`, `CancellationToken.none` by default, and rejects with an `OperationCanceledException` once it is canceled, and the diff model cancels the run still out through its own `CancellationTokenSource` when it is disposed.
  The worker side lives in the core, because a worker can't run Angular: a worker script fills a `BackgroundJobRegistry` of its own, since it can't receive the page's, and answers with the core's `WorkerJobHost` over the core's `IWorkerJobRequest`, `WorkerJobResponse` and `WorkerJobAnswer`.
  A worker script imports only framework-free packages, the core and the diff and merge models, never Angular, and a test of the diff view package loads its worker script in a real worker to keep it so; the Angular package keeps the page side, `WorkerRunner`, which runs a job the worker doesn't hold, and every job once the worker fails, on its fallback.

## Text model

- A `TextDocument` keeps its lines in chunks of up to 512 lines, with each chunk's first line and first character offset.
  Finding a line by number, or a line by character offset, is a binary search over the chunks and a walk inside one; an edit changes one chunk and the chunks it removes, so a 1,000,000-line document, about 2,000 chunks, edits as fast as a short one.
- Positions are a line and a column in UTF-16 code units, as the DOM counts them; a view never splits a surrogate pair or a CRLF.
- A document keeps each line's break, LF, CRLF or CR, as read, and writes the text back unchanged, a final break or its absence included.
- Every change is an `EditTransaction`: a set of non-overlapping replacements against one version, with the selections before and after.
  Applying it gives a new version number and a `TextChange` that views, tokenizers, search and merge state map their positions through.
- Undo and redo hold transactions, not snapshots.
  Typing and deleting group into one step until the kind of edit changes, the caret jumps, the setting `editor.undoGroupMilliseconds`, 500 by default, passes with no edit, or the view seals the step; any other edit, such as a paste, is a step of its own, and each step restores the selections it had before.
  A transaction carries its time, from the input event, so grouping needs no clock of its own.
  The history keeps at most `editor.undoLimit` steps, 10,000 by default, and drops the oldest past it.
- The model is the single source of the text: a view renders from it and sends input to it, and never reads text back from the DOM.

## The code view

- Only the lines in view, and a margin of lines on each side, are in the DOM; a spacer gives the scroll area the height of every line at the fixed line height.
  At 20px a line, 1,000,000 lines are 20,000,000px, under Chromium's element height limit of about 33,500,000px, the only engine the app runs on.
- Scrolling moves the rendered lines in one transform per frame and reuses line elements, so a frame changes only the lines that enter or leave the view.
- Lines do not wrap in this stage; a long line scrolls sideways.
- The gutter shows line numbers, and the markers and fold toggles its owner gives it; it scrolls vertically with the lines and stays in place sideways.
- Input goes through one hidden `textarea` that holds the focus, as the platform's text input expects: keys, paste, cut and composition events reach it, and the view turns them into transactions.
  A text dragged over the view shows a drop caret where it would land, and dropping it inserts it there, selected, as one transaction; a dropped file, or anything without plain text, is refused, and so is any drop on a read-only view.
  Dragging the selected text within the view moves it, with the same drop caret, as one transaction; a click inside the selection without a drag places the caret.
  During an IME composition, the view shows the composing text in place, underlined, and commits it as one transaction when the composition ends.
- Carets and selections are drawn by the view, with any number of selections.
- For screen readers, the textarea holds the caret's line and the lines around it, with the selection mirrored into it, so a screen reader reads the line, the character and the selection as it would in a native field; the view is a `textbox` with `aria-multiline`, named by its owner, and announces a jump to another line by reading the line.
- Keyboard: every key runs a command through the key bindings, below: the platform's text-field keys, with Home and End to the line's ends everywhere and Ctrl with them to the document's ends on Windows and Linux only, Ctrl or Cmd with Z, Y and Shift+Z for undo and redo, Tab and Shift+Tab indent and outdent when the owner allows it and otherwise move the focus, and Escape leaves a multiple selection or search.
- Search finds text or a regular expression, with case and whole-word options, through the core's incremental search, highlights every match in view, and moves between matches; replace is part of it.
  The code view's find bar opens with Ctrl+F, or Cmd+F on Mac, seeded with the selected text, and with its replace row on Ctrl+H, or Cmd+Alt+F on Mac, unless the view is read-only; Enter and Shift+Enter move to the next and previous match, Escape closes it and gives the focus back, and a replace or a replace-all is one undo step.
- A document's language comes from its set's language registry, by whole file name, file name pattern, longest extension or first line, and its tokenizer from the highlighter registry, which gives each language to the highlighter assigned to it or else the last registered one that supports it, and makes the tokenizer on first use.
- The views take a `language`, an id or a definition, never a tokenizer: `LanguageTokenizer` finds the language in the app's set and its tokenizer through the app's highlighter registry, in the background, so each language's tokenizer is made once for the app, and the text stays plain until it is ready, or for good when no highlighter supports the language or its load fails.
  Each token carries an open type, such as `keyword.control`, and modifiers; the views' token classes and their rules are generated from the token type registry, each type colored with its own color variable, which falls back to its parent's and on to the kit's code token colors, so a new type needs no rule of its own.
- Syntax highlighting colors tokens from a tokenizer that keeps a state at each line's end, so an edit tokenizes from its first changed line only until a line's end state matches the one it had, as the decision on grammars below needs.
  The view tokenizes in the background in slices of up to 5 milliseconds; a line in view more than 50 lines past the tokenized ones gets provisional tokens, until the background pass reaches it and its colors settle.
  The first such line starts from a guessed state: from the initial state, it tokenizes only the lines among the 50 above it that are less indented than every line between, so a jump tokenizes about the lines in view rather than 50 more; each next line in view continues from the line before it.
  The cache keeps its tokens in chunks of 1,024 lines, so an edit to a 1,000,000-line document copies only the chunk it reaches: `TokenCacheTests.followsAnEditToA1000000LineDocumentWithoutReadingItsLinesCopyingOnlyTheChunkEachEditReachesAndReReadsOnlyTheLinesTheEditsReach`; a jump in it reads only the lines in view: `CodeEditorComponent` "jumps to line 500,000 of a highlighted 1,000,000-line document, coloring the lines in view at once, reading only the lines in view" and "colors a line past the tokenized ones provisionally, then settles its colors once the background tokenizing reaches it".

### Decorations

The code view's owner draws on it through a public API of marks over its lines and text and rows inserted between its lines, with no knowledge of what the marks mean in the view:

- `decorations`, a list of layers, each an `ICodeDecorations`, such as the array-backed `CodeDecorations`; the view asks each layer only for the lines in view, so a layer can compute them lazily, as the diff view's does, and a later layer paints over an earlier one.
  A layer over a large document stays lazy by indexing its marks by line, as `CodeDecorations` and the diff view's layer do with one `LineIndex` each, the diff view's over the comparison's changes, from which it builds the decorations of the lines asked for; its inserted rows are read whole whenever the layers change, so they stay few, about one per change.
  `ICodeDecorations` grows only by optional members, so a layer written for an earlier version keeps compiling; `CodeDecorations`' positional arrays are kept for 0.0.1.
- A layer holds `CodeLineDecoration`s, a background over a run of lines, painted in the gutter and behind the text; `CodeRangeDecoration`s, a background over characters; `CodeGutterMarker`s, a sign in the gutter in a color, the latest layer's winning on a line; inserted rows, which take rows between lines: `CodeBar`, a one-row bar with an icon, a note and actions, `CodeSpacer`, filler rows, striped unless painted, with an optional sign, and `CodeEmbeddedLines`, lines of another document, with its own tokens and decorations; and an optional `ICodeNumbering`, a second line number column.
  The view "paints each set's line backgrounds in the gutter and behind the text, a later set over an earlier one, each paint filling its row", "marks the gutter with the latest set's marker on a line, in its color, and marks no line of a view without decorations", "paints a range's characters on each line it covers, from its start column to its end, and nothing on a line it only reaches", "draws a bar above its line, in its own colors, with its icon, note and actions, and tells its owner which action was clicked", "lays a bar across the view's visible width, from its left edge, and keeps it there when the text scrolls sideways", "fills spacer rows with stripes, or paints them and marks them when given a background and a sign", "shows another document's lines inside the view, numbered by their own lines and painted by their own decorations" and "numbers its lines by a set's numbering in a second column, sized for its largest number, with no number where it has none", each measuring its rows' top, height and edges in rem.
- `CodeInsertedRows` is the closed union of those three classes, which share an internal base that builds their rows, so an owner can't give the view a kind of row it can't draw.
  Each decoration's constructor throws `ArgumentOutOfRangeException` for a negative or fractional line or count, and `CodeEmbeddedLines` for lines past its document's end: the specs of `CodeSpacer`, `CodeBar`, `CodeEmbeddedLines`, `CodeFold`, `CodeLineDecoration` and `CodeGutterMarker`.
- `folds`, a list of `CodeFold`s: a collapsed fold shows as one row with its label, or a count of its lines, and hides the rows inside it; an expanded fold keeps a toggle on its first line; `foldToggle` tells the owner of a click on either, and the owner gives the view the folds' new state: "collapses a fold to one labeled row with a toggle, hides the rows inside it, and keeps a toggle on an expanded fold's first line".
  A collapsed fold inside or overlapping an earlier collapsed fold is drawn as part of it, and one past the last line up to that line: `CodeBlocks` "keeps a collapsed fold inside or overlapping an earlier collapsed fold out, so the rows stay in order and count every line" and "clamps a collapsed fold that reaches past the last line, and leaves out folds and rows that start past it", and `CodeEditorComponent` "draws a collapsed fold inside another as part of it, and a fold past the last line up to that line".
  Ctrl+Shift+[, or Cmd+Alt+[ on Mac, toggles the innermost expanded fold around the caret, and Ctrl+Shift+], or Cmd+Alt+] on Mac, a collapsed fold on the caret's line, the next or the one it ends at, through `foldToggle` as a click does; each toggle is 1.5rem wide and a row high: "toggles the innermost open fold around the caret, or the closed fold beside it, from the keyboard, each toggle 1.5rem wide and a row high".
- `barAction` tells the owner of a click on a bar's action, with the bar and the action, each named by its owner's id.
- Each decoration is a class whose later fields come as optional constructor parameters at the end, so an addition never breaks an owner, and colors are CSS values, so they reach the view's emulated styles.
  In 0.0.x a decoration's positions are its owner's to move after an edit, as the diff and merge views do by building their layers again.
- The code view's element takes six public custom properties, each with the kit's value when unset, which the merge view sets on its panes: `--nol-code-editor-font-size`, `--nol-code-editor-line-height`, `--nol-code-editor-gutter-width`, `--nol-code-editor-gutter-end`, `--nol-code-editor-signs` and `--nol-code-editor-inset`: "takes its font size, line height, gutter width and end, signs and text inset from the public custom properties on its element".

## The diff view

- The diff view compares an original and a modified text, side by side or inline, with the modified side editable when its owner allows it.
- The diff model's `DocumentDiff` computes a line diff, again after each edit to either text, then, when a change is shown, a character diff over its lines on both sides, up to its `characterDiffLimit`, 20,000 characters by default, so the views show changed lines and the changed characters in them.
  Both diffs come from an `IDiffAlgorithm`, the core's contract with two calls, `lines` and `characters`; the default is `@noldova/diff`'s, and a host can give its own.
- Side by side shows two code views whose scrolling is locked by their unchanged regions; inline shows removed lines as read-only blocks between the modified text's lines; the automatic layout, the default, is side by side until the view is narrower than its inline breakpoint, 50rem by default.
  The original is read-only unless its owner asks, and then keeps an undo history of its own.
  Both are the code view with a layer of decorations from the diff view: each changed line's background and sign, its changed characters as ranges, and filler rows or the removed lines as inserted rows.
  Side by side, the shorter side of each change gets filler rows, so both sides have the same rows and share one scroll position; inline, the blocks are the removed lines, and the gutter shows the original's and the modified text's line numbers in two columns.
- Every line diff runs as a background job, the diff model's `LineDiffJob`, on the runner its owner gives: in the browser the diff view package's `DiffWorker`, a `WorkerRunner` whose worker serves the default algorithm's job, so the view keeps taking input while it runs.
  Without a worker the core's `SlicedRunner` runs the job on the page in 5 ms slices; the algorithm's one `lines` call is a single step, so a large diff still holds the page for its whole time until the diff package can resume a diff part way (noldova-com/diff#8).
  Until its result lands, the diff is pending and moves the changes it shows through each edit, marking the edited lines as changed; a result for text that has changed since is dropped and the diff runs again, and if the runner fails, the diff keeps the changes it has and says it failed.
- Unchanged regions longer than a limit collapse to a fold row that expands them, and an expanded region keeps a toggle on its first line that collapses it again.
  The diff model's `unchangedRegions` lists them, keeping the `diff.contextLines` setting's lines next to each change, three by default, and collapsing only where `diff.minimumHiddenLines` or more are left, three by default; a region opens on both sides on a click on its row or when a caret moves into it.
- Each change is reachable by keyboard, Alt with Down or Up as in the kit's diff view, through the `diffEditor.nextChange` and `diffEditor.previousChange` commands, which the registries let a host rebind, or by the view's `nextChange` and `previousChange`, and is named for screen readers, such as "Change 2 of 5, 3 lines removed, 4 added".

## The merge view

- The merge view takes a base and two sides, ours and theirs, and their labels, and shows ours and theirs read-only above an editable result.
- Without `merged`, `Merge3` finds the regions: it diffs base to ours and base to theirs and walks both diffs together, so each region is unchanged, changed on one side, changed the same way on both, or a conflict.
- Regions changed on one side or the same way on both are merged into the result at once; each conflict starts unresolved, with the base's text in the result and a marker in the gutter.
- For each conflict, the person accepts ours, theirs, both with ours first, or both with theirs first, or edits the result freely; accepting replaces that conflict's text in the result as one undoable transaction.
- A conflict's range in the result follows every edit through the model's changes, so a free edit inside it marks it Edited, and an edit that removes it all marks it Resolved with no text.
- The view tells its owner the result text and the number of conflicts still unresolved after every change, and moves between conflicts by keyboard; each conflict is named for screen readers with its number and state.

### The merge view's API

`MergeEditor`, the `noldova-merge-editor` component:

- Inputs: `base`, `ours` and `theirs`, the texts, each null when that side has no file (a null base, both sides added, reads as empty); `merged`, optional, Git's merged file with its zdiff3 conflict markers; `language`, an id or a definition, passed to every pane; `oursLabel` and `theirsLabel`; `readOnly`; `toolbar`, true unless its owner turns off the bar between the sides and the result, as an owner that holds those choices in its own frame does. `panels`, false unless its owner draws each side and the result as a card, `--nol-panel` with a `--nol-card-border` border and a `--nol-radius-large` corner on a clear ground.
- Heads: content marked `nolMergeOursHead`, `nolMergeTheirsHead` and `nolMergeResultHead` is projected at the top of its side and of the result, above the code; the sides take 1 and the result 1.1 of the height the bar leaves, and `--nol-merge-editor-gap`, 0 by default, spaces the sides, the bar and the result.
- When `merged` is given, the conflicts are the ones its markers mark, so they match Git's own merge and its recorded resolutions; a file whose markers don't parse shows the line that breaks them in place of the merge, and `markersFailed` gives it to the owner.
  Without it, the core's 3-way merge finds them.
- Each conflict's state is a `ConflictState`: `Unresolved`, `Ours`, `Theirs`, `BothOursFirst`, `BothTheirsFirst`, `Suggested` or `Edited`; the result shows an unresolved conflict's base text, or an empty row for one with no text, under a warning bar that says it is open and holds Ours, Theirs, Both, ours first, and Suggested, which takes the conflict's suggestion, when it has one.
  A resolved conflict's lines take the color of the side they came from, ours in the kit's third author color and theirs in its fifth, each part of both in its order, or a gradient from one to the other for a suggested or edited text.
- When ours or theirs is null, the view shows the side that is left, read-only, under a note naming the side that deleted the file, with no result and no conflicts; the owner offers the whole-file choices.
- The view draws each pane through the code view's decorations: line backgrounds for the sides' and the result's conflict text, gutter markers for an open conflict's lines, a `CodeBar` for each chunk and open conflict, and a painted `CodeSpacer` for a conflict with no text.
- Ours and theirs show read-only side by side, each with its text of each conflict in its color, and no change signs or filler rows; between them and the result, a bar counts the unresolved conflicts and holds the choices for the conflict with the caret.
  Each side shows a bar across the pane above each conflict's text, with its number and state, and Take at its end, which accepts that side for it; the bar sits where that text starts a line, searching on from the conflict before, or, for a side that deleted it, above the line the result has after it, and a side without that text shows none.
  The bars are the code view's `CodeBar`s, one row high, and their buttons are 1.25rem high in a 24px hit area; read-only, the bars show without them.
  The three panes have 13px text on 1.25rem lines and a 2.75rem gutter of line numbers only, 0.75rem before its edge, with the text right after it.
- Outputs: `resultChange`, the result after every change; `conflictsChange`, the conflicts' states, at the start and whenever they change; `activeConflictChange`, the conflict with the caret, or null; `markersFailed`, the `ConflictMarkersException` of a merged file whose markers don't parse.
- Signal: `activeConflict`, an `ActiveConflict` for the conflict with the caret, or null: its index from 0, the conflicts' count, its base text, null when the merge has no base, its state, and the first and last lines it covers in the result, from 0, the same line for a conflict with no text.
- Methods: `result()`, null when a side deleted the file or the markers failed, `unresolvedCount()`, `dirty()` and `markClean()`; `accept(index, choice)`, `acceptAll(choice)`, which accepts that choice for every unresolved conflict as one undoable step, `reset(index)` and `setConflictText(index, text)`, which marks a conflict `suggested` until the person edits it; `revealConflict(index)`, `nextConflict()` and `previousConflict()`; `undo()`, `redo()` and `focus()`.
- It takes text only: the app handles binary and oversized files and decoding before the view, and the view keeps a byte order mark, the line breaks and a final break, or its absence, as given.

## Performance

The tests count the work rather than time it, so a slower or busier machine can't fail them, and a change that makes the work grow with the document does.

`npm run perf` times the same work in headless Chromium, with Angular in production mode, and fails nothing on a slow figure, only on a case with no samples.
Measured on 2026-11-26 at 0.0.2, as the median and slowest of each case's samples, in milliseconds:

| Case | Samples | Linux, Intel Core i7-11700F, 4 logical processors | macOS, Intel Core i9-8950HK, 12 logical processors | Windows, Intel Core i7-11700F, 4 logical processors |
|---|---:|---:|---:|---:|
| Opening a 1,000,000-line document until its first lines show, plain | 5 | 117 / 145 | 176 / 202 | 133 / 165 |
| The same, highlighted, until its first line shows colored | 5 | 277 / 405 | 391 / 520 | 283 / 400 |
| A keypress in its middle, the work before the frame | 100 | 1.7 / 4.5 | 1.6 / 4.3 | 1.8 / 7.0 |
| The same, until the line is painted | 100 | 17 / 19 | 17 / 23 | 17 / 75 |
| A scroll frame from top to bottom, the work before the frame | 1,500 | 2.0 / 12.6 | 2.0 / 4.4 | 1.8 / 9.5 |
| The same, until the frame is painted | 1,500 | 17 / 22 | 17 / 25 | 17 / 69 |
| Searching it for a word on every line, until the first matches show | 5 | 27 / 32 | 25 / 36 | 27 / 33 |
| The same, until it counts the last match | 5 | 489 / 556 | 741 / 751 | 498 / 556 |
| A diff of two 100,000-line documents, one line in a hundred changed, in a worker until the changes show | 5 | 131 / 271 | 111 / 228 | 137 / 249 |

A painted keypress or frame waits for the next frame, about 16.7 ms at 60 Hz, so the work before it is the editor's own cost. The count of a million matches takes under a second, since each line's matches are kept as column pairs and the background search reads the clock once every 64 lines, a read costing more than searching a short line; the find bar shows the matches found so far with a plus until then. Opening the document is followed in #20, and the single slow keypresses and frames on Windows in #21.

- Opening a 1,000,000-line document builds its tree in one pass, copying each character into one chunk, and an edit in its middle copies only the chunk it reaches, 512 lines: `TextDocumentTests.opensA1000000LineDocumentCopyingEachCharacterIntoOneChunkAndEditsItsMiddleCopyingOnlyTheChunkTheEditReaches`.
  `TextDocument.fromTextAsync` builds the same tree in slices of 500,000 characters and awaits the pause its caller gives between them, such as a zero timeout in a page, so a long open never holds the page: `CodeEditorComponent` "opens a 1,000,000-line document in slices of under a million characters and shows it, reading only the lines in view".
- A keypress in a 1,000,000-line document updates the model and its view reading only the lines in view: `CodeEditorComponent` "takes a keypress in the middle of a 1,000,000-line document and updates its view, reading only the lines in view".
- Search keeps each line's matches in chunks with a match count per chunk, searches the lines in view at once and the rest in background slices that read the clock once every 64 lines, and after an edit searches again only the edited lines: `SearchResultsTests.searchesOnlyTheLinesAskedAtOnceThenTheRestInBackgroundSlicesReadingTheClockOnceEvery64LinesEachLineOnce` and `SearchResultsTests.findsTheMatchesInViewOfA1000000LineDocumentSearchingOnlyTheLinesInViewAndFollowsAnEditSearchingNone`.
  Until the background finishes, the find bar shows the matches found so far with a plus; a keypress in the find field or in the text of a 1,000,000-line document with a query set reads only the lines in view: `FindBarComponent` "takes keypresses in the field and the text of a 1,000,000-line document reading only the lines in view, counting the matches in the background".
- Scrolling a 1,000,000-line document, once open, renders only the lines each frame reaches: `CodeEditorComponent` "scrolls a 1,000,000-line document frame by frame, once open, rendering the lines each frame reaches, reading only the lines in view".
- Highlighting follows an edit copying only the chunk it reaches, and tokenizes again only the lines the edit reaches: `TokenCacheTests.followsAnEditToA1000000LineDocumentWithoutReadingItsLinesCopyingOnlyTheChunkEachEditReachesAndReReadsOnlyTheLinesTheEditsReach`.
- A line diff of two 100,000-line texts reads each line a few times, and a merge of three the same, as `@noldova/diff`'s own tests show.
  A diff or merge over that runs in a worker, where the core runs unchanged; the diff does so now through the background job runner, and the merge will with the merge view.

## Testing

- The core's, the diff model's and the merge model's tests are `@noldova/context.testing` test classes, compiled by each package's `tests/tsconfig.json` into `_build/node/<package>.tests` and run in Node against the installed packages, which they import by their names, as an app does, and their internals by their paths inside the package, which each `tests/internals.d.ts` declares; `npm test` fails unless they run every block of both installed packages, `api/index.js` included.
- The scripts' own tests, under `scripts/tests`, run in the same suite, as CONTEXT's do.
- Each Angular package's specs keep Angular's build and run in a real Chromium, as Angular's test builder runs them, measuring geometry in rem, on Linux, macOS and Windows; `npm test` runs the code view's, the diff view's and then the merge view's after the suite, each with its own 100% coverage gate.
- Each requirement above names its test once code exists; the performance figures are measured, not assumed.

## Decisions

- **Diff and 3-way merge.** They are general capabilities with no editor types, so they live in `@noldova/diff`, its own repository and package, which the diff and merge models install from npm, pinned exactly; its architecture document holds its algorithms.
- **Grammars.** Highlighting goes through the code editor's tokenizer contract, which resumes from a line's saved state.
  The code editor implements it over the grammars the kit already uses, keeping their grammar state between lines, so it adds no package and changes nothing in the kit; lexers on CONTEXT's parsers can replace it later behind the same contract.
- **Module or library.** The code editor is a module for Noldova apps in the form of a library that an app's or a module's window part uses, with no runtime part of its own, unlike a Noldova Desktop module such as Terminal.
- **Seven packages.** The TextMate highlighter, the diff and merge models and their views are packages of their own, so an app that shows only code installs neither diff nor merge, and an IDE builds on the code view's decorations as the diff and merge views do.
- **Decorations.** The code view takes layers of decorations rather than one owner's model of rows, so the diff view, the merge view and an IDE's own marks, such as diagnostics, draw on one view without knowing each other; template zones, rows of an owner's own components, wait past 0.0.1.
- **The merge view's layout.** Ours and theirs sit side by side above the result; a layout with ours, the result and theirs in three columns is a possible alternative.
