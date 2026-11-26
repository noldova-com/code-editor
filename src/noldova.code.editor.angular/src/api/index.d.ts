/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { InputSignal, OutputEmitterRef, Signal } from "@angular/core";
import type { CommandContext, EditorRegistries, IBackgroundJob, IBackgroundRunner, ILanguageDefinition, ILineTokenizer, KeyDispatchResult, KeyPress, TextDocument, TextPosition, TextRange, TextSelection, TokenCache,
  UndoHistory } from "@noldova/code.editor";
import type { IReadOnlyList } from "@noldova/context.collections";
import { Exception } from "@noldova/context.exceptions";

/**
 * Reports that a background job failed in a {@link WorkerRunner}'s worker,
 * or that the runner was disposed before the job ended.
 */
export declare class BackgroundJobFailedException extends Exception {
  /**
   * `BackgroundJobFailedException`.
   */
  readonly name: string;

  /**
   * Creates the exception with the message
   * "The background job `job` failed in the worker: `reason`."
   *
   * @param job The job's name.
   * @param reason A short reason, such as an error's message; the message
   * ends with one period whether or not it has one.
   * @example
   * ```ts
   * import { BackgroundJobFailedException } from "@noldova/code.editor.angular";
   *
   * new BackgroundJobFailedException("sample.sum", "the runner was disposed").message;
   * ```
   */
  constructor(job: string, reason: string);
}

/**
 * Runs background jobs in a web worker, so a view keeps taking input while
 * they run; any package's jobs, by name.
 *
 * @remarks
 * The worker runs the core's `WorkerJobHost` over its script's own
 * `BackgroundJobRegistry`, since a worker can't receive the page's
 * registries. A job that registry doesn't hold runs on the fallback runner,
 * in slices on the page, as does every run once the worker fails or
 * doesn't load; the fallback is the core's `SlicedRunner` when none is
 * given. A job that throws in the worker rejects its run with a
 * {@link BackgroundJobFailedException}. The app's build bundles the worker
 * script through `webWorkerTsConfig`; the script imports only framework-free
 * packages, such as the core, never Angular, which can't run in a worker.
 *
 * @example
 * ```ts
 * import { WorkerRunner } from "@noldova/code.editor.angular";
 *
 * using runner = new WorkerRunner(new Worker(new URL("./jobs.worker.ts", import.meta.url), { type: "module" }));
 * ```
 */
export declare class WorkerRunner implements IBackgroundRunner, Disposable {
  /**
   * The runner for the jobs the worker can't run.
   */
  readonly fallback: IBackgroundRunner;

  /**
   * Creates a runner that posts each job to a worker.
   *
   * @param worker A worker whose script runs the core's `WorkerJobHost`.
   * @param fallback The runner for jobs the worker can't run; a new
   * `SlicedRunner` when not given.
   * @example
   * ```ts
   * import { SlicedRunner } from "@noldova/code.editor";
   * import { WorkerRunner } from "@noldova/code.editor.angular";
   *
   * using runner = new WorkerRunner(new Worker(new URL("./jobs.worker.ts", import.meta.url), { type: "module" }), new SlicedRunner(10));
   * ```
   */
  constructor(worker: Worker, fallback?: IBackgroundRunner);

  /**
   * Whether runs still go to the worker: false once it failed, didn't load
   * or the runner was disposed.
   */
  get usesWorker(): boolean;

  /**
   * Runs a job in the worker, or on the fallback when the worker can't.
   *
   * @param job The job; the worker finds its own copy by the job's name.
   * @param input Its input, which the worker receives as a structured clone.
   * @param signal Stops waiting for the run: the promise rejects with the
   * signal's reason, and the worker's answer is dropped.
   * @returns The job's output; it rejects with a
   * {@link BackgroundJobFailedException} when the job throws in the worker or
   * the runner is disposed first.
   * @example
   * ```ts
   * import type { IBackgroundJob } from "@noldova/code.editor";
   * import type { WorkerRunner } from "@noldova/code.editor.angular";
   *
   * declare const runner: WorkerRunner;
   * declare const job: IBackgroundJob<readonly number[], number>;
   * await runner.runAsync(job, [1, 2, 3]);
   * ```
   */
  runAsync<TInput, TOutput>(job: IBackgroundJob<TInput, TOutput>, input: TInput, signal?: AbortSignal): Promise<TOutput>;

  /**
   * Ends the worker and rejects every run still waiting for it.
   *
   * @example
   * ```ts
   * import type { WorkerRunner } from "@noldova/code.editor.angular";
   *
   * declare const runner: WorkerRunner;
   * runner[Symbol.dispose]();
   * ```
   */
  [Symbol.dispose](): void;
}

/**
 * Runs a step of background work after each edit to a document, in setTimeout
 * slices, until the step says it is done; for work such as tokenizing that
 * follows a document a view doesn't show.
 *
 * @example
 * ```ts
 * import { TextDocument, TokenCache } from "@noldova/code.editor";
 * import { BackgroundTicker } from "@noldova/code.editor.angular";
 *
 * declare const cache: TokenCache;
 * using ticker = new BackgroundTicker(TextDocument.fromText("a"), hasTime => cache.advance(hasTime));
 * ```
 */
export declare class BackgroundTicker implements Disposable {
  /**
   * Starts the ticks: one now and one after each edit.
   *
   * @param document The document whose edits start the step again.
   * @param step The work of one slice; it works while `hasTime` is true and
   * returns whether work is left.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { BackgroundTicker } from "@noldova/code.editor.angular";
   *
   * using ticker = new BackgroundTicker(TextDocument.fromText("a"), () => false);
   * ```
   */
  constructor(document: TextDocument, step: (hasTime: () => boolean) => boolean);

  /**
   * Stops following the document and drops the next tick.
   *
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { BackgroundTicker } from "@noldova/code.editor.angular";
   *
   * new BackgroundTicker(TextDocument.fromText("a"), () => false)[Symbol.dispose]();
   * ```
   */
  [Symbol.dispose](): void;
}

/**
 * A view's key dispatch, which a view provides for itself and the views
 * inside it, so a code view in a diff or merge view shares one
 * {@link KeyDispatcher} with its host and dispatches each press through its
 * own context and then its hosts'.
 *
 * @remarks
 * A host view provides it, attaches its command context and listens; a code
 * view inside finds it as its parent, so a key sequence may begin in the
 * pane and a host's binding may complete it, and every view in the chain
 * hears the pending chord.
 *
 * @example
 * ```ts
 * import { Component, inject } from "@angular/core";
 * import type { CommandContext } from "@noldova/code.editor";
 * import { CodeEditorComponent, KeyScope } from "@noldova/code.editor.angular";
 *
 * @Component({ selector: "app-pair", imports: [CodeEditorComponent], providers: [KeyScope], template: "" })
 * export class PairComponent {
 *   public constructor() {
 *     const keys: KeyScope = inject(KeyScope);
 *     keys.attach(time => this.contextAt(time));
 *     keys.listen(label => console.log(label));
 *   }
 *
 *   private contextAt(_: number): CommandContext {
 *     throw new Error("The app's own context.");
 *   }
 * }
 * ```
 */
export declare class KeyScope {
  /**
   * Gives the scope the command context its view's bindings run in, for the
   * presses of the views inside it.
   *
   * @param contextOf Makes the context for a press's time.
   */
  attach(contextOf: (time: number) => CommandContext): void;
  /**
   * Hears the pending chord's label, and null once no sequence is pending,
   * for this scope and the views inside it.
   *
   * @param listener Called with each change.
   */
  listen(listener: (label: string | null) => void): void;
  /**
   * Dispatches a press of this scope's view through its context and then
   * its hosts'.
   *
   * @param press The press.
   * @param context The view's command context.
   * @returns What the shared dispatcher did with the press.
   */
  dispatch(press: KeyPress, context: CommandContext): KeyDispatchResult;
  /**
   * Drops the pending sequence, telling the listeners when one was pending.
   */
  cancel(): void;
}

/**
 * Makes a language's tokenizer for a view, in the background, through the
 * highlighters of the app's {@link CodeEditorRegistries}, which make each
 * language's tokenizer once for the app.
 */
export declare class LanguageTokenizer {
  /**
   * The tokenizer of a view's language, for a view that colors code itself.
   * @param language The language: its id in the app's registries, its
   * definition, or null.
   * @returns The tokenizer, or null while it loads, when the language is null
   * or unknown, when no highlighter supports it, or when its load failed.
   * @remarks Call it in an injection context, such as a field of a component.
   * @example
   * ```ts
   * import { Component, input, type InputSignal, type Signal } from "@angular/core";
   * import type { ILineTokenizer } from "@noldova/code.editor";
   * import { LanguageTokenizer } from "@noldova/code.editor.angular";
   *
   * @Component({ selector: "app-preview", template: "" })
   * export class PreviewComponent {
   *   public readonly language: InputSignal<string | null> = input<string | null>(null);
   *   private readonly tokenizer: Signal<ILineTokenizer | null> = LanguageTokenizer.of(this.language);
   * }
   * ```
   */
  static of(language: Signal<string | ILanguageDefinition | null>): Signal<ILineTokenizer | null>;
}

/**
 * Finds the items whose line spans overlap a run of lines, such as the changes
 * a view's visible rows show.
 *
 * @example
 * ```ts
 * import { List } from "@noldova/context.collections";
 * import { CodeFold, LineIndex } from "@noldova/code.editor.angular";
 *
 * const index = new LineIndex<CodeFold>(new List([new CodeFold(0, 2, false), new CodeFold(5, 1, false)]), t => t.startLine, t => t.startLine + t.lineCount);
 * index.overlapping(1, 3).count(); // 1
 * ```
 */
export declare class LineIndex<TItem extends {} | null> {
  /**
   * Indexes the items.
   *
   * @param items The items, in any order, overlapping or not.
   * @param startOf An item's first line.
   * @param endOf The line after an item's last.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { LineIndex } from "@noldova/code.editor.angular";
   *
   * new LineIndex<number>(new List([1, 4]), t => t, t => t + 1);
   * ```
   */
  constructor(items: IReadOnlyList<TItem>, startOf: (item: TItem) => number, endOf: (item: TItem) => number);

  /**
   * The items that overlap lines `[start, end)`, in the order given.
   *
   * @param start The first line.
   * @param end The line after the last.
   * @returns The overlapping items.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { LineIndex } from "@noldova/code.editor.angular";
   *
   * new LineIndex<number>(new List([1, 4]), t => t, t => t + 1).overlapping(0, 2).toArray(); // [1]
   * ```
   */
  overlapping(start: number, end: number): IReadOnlyList<TItem>;
}

/**
 * The `noldova-code-text` component: a read-only block of code, colored by
 * its language and the token types of {@link CodeEditorRegistries}, with no
 * gutter, caret or scrolling of its own.
 *
 * @example
 * ```ts
 * import { Component } from "@angular/core";
 * import { CodeTextComponent } from "@noldova/code.editor.angular";
 *
 * @Component({
 *   selector: "app-snippet",
 *   imports: [CodeTextComponent],
 *   template: "<noldova-code-text text=\"const a = 1;\" />"
 * })
 * export class SnippetComponent {}
 * ```
 */
export declare class CodeTextComponent {
  /**
   * The code to show; required.
   */
  readonly text: InputSignal<string>;

  /**
   * The language that colors the code: its id in the app's
   * {@link CodeEditorRegistries}, its definition, or null, when not bound,
   * for plain text. The view finds the language's highlighter and makes its
   * tokenizer in the background, showing the text plain until it is ready,
   * and for good when no highlighter supports the language or its load fails.
   */
  readonly language: InputSignal<string | ILanguageDefinition | null>;

  /**
   * Creates the view, which Angular does for each `noldova-code-text`
   * element, and puts the app's token rules in the page.
   *
   * @example
   * ```ts
   * import { Component } from "@angular/core";
   * import { CodeTextComponent } from "@noldova/code.editor.angular";
   *
   * @Component({
   *   selector: "app-snippet",
   *   imports: [CodeTextComponent],
   *   template: "<noldova-code-text text=\"let a = 1;\" />"
   * })
   * export class SnippetComponent {}
   * ```
   */
  constructor();
}

/**
 * A background over a run of whole lines of the code view, painted behind
 * their text and in their gutter cells.
 *
 * @remarks
 * In 0.0.x the view never moves a decoration through an edit: its positions
 * are its owner's to remap, by giving the view new decorations after each
 * change. Later fields come as optional constructor parameters at the end,
 * so adding one never breaks an owner.
 */
export declare class CodeLineDecoration {
  /**
   * The first line it paints, from 0.
   */
  readonly startLine: number;

  /**
   * How many lines it paints; 0 paints none.
   */
  readonly lineCount: number;

  /**
   * The CSS background it paints, such as a color, a `color-mix()` or a
   * gradient.
   */
  readonly background: string;

  /**
   * Creates a line decoration.
   *
   * @param startLine The first line it paints, from 0.
   * @param lineCount How many lines it paints.
   * @param background The CSS background it paints.
   * @throws {ArgumentOutOfRangeException} When `startLine` or `lineCount` is negative or not a whole number.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { CodeDecorations, CodeLineDecoration } from "@noldova/code.editor.angular";
   *
   * const added = new CodeDecorations(new List([new CodeLineDecoration(4, 2, "var(--nol-added-background)")]));
   * ```
   */
  constructor(startLine: number, lineCount: number, background: string);
}

/**
 * A background over a range of characters, such as a diff's changed
 * characters, on each line the range covers; a range that ends at column 0
 * of a line paints nothing on that line.
 *
 * @remarks
 * In 0.0.x its positions are its owner's to remap after an edit. Later
 * fields, such as a text color and an underline for diagnostics, come as
 * optional constructor parameters at the end.
 */
export declare class CodeRangeDecoration {
  /**
   * The characters it paints.
   */
  readonly range: TextRange;

  /**
   * The CSS background it paints.
   */
  readonly background: string;

  /**
   * Creates a range decoration.
   *
   * @param range The characters it paints.
   * @param background The CSS background it paints.
   * @example
   * ```ts
   * import { TextPosition, TextRange } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   * import { CodeDecorations, type CodeLineDecoration, CodeRangeDecoration } from "@noldova/code.editor.angular";
   *
   * const word = new CodeRangeDecoration(new TextRange(new TextPosition(2, 4), new TextPosition(2, 9)), "var(--nol-added-change)");
   * const layer = new CodeDecorations(new List<CodeLineDecoration>(), new List([word]));
   * ```
   */
  constructor(range: TextRange, background: string);
}

/**
 * A sign in a line's gutter cell, such as a diff's `+` or a conflict's `!`;
 * when several layers mark one line, the latest layer's marker shows.
 *
 * @remarks
 * In 0.0.x its line is its owner's to remap after an edit. Later fields,
 * such as an icon and a click, come as optional constructor parameters at
 * the end.
 */
export declare class CodeGutterMarker {
  /**
   * The line it marks, from 0.
   */
  readonly line: number;

  /**
   * The sign it shows, a character or two.
   */
  readonly text: string;

  /**
   * The sign's CSS color.
   */
  readonly color: string;

  /**
   * Creates a marker.
   *
   * @param line The line it marks, from 0.
   * @param text The sign it shows.
   * @param color The sign's CSS color.
   * @throws {ArgumentOutOfRangeException} When `line` is negative or not a whole number.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { CodeDecorations, CodeGutterMarker, type CodeLineDecoration, type CodeRangeDecoration } from "@noldova/code.editor.angular";
   *
   * const layer = new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List([new CodeGutterMarker(7, "!", "var(--nol-warning)")]));
   * ```
   */
  constructor(line: number, text: string, color: string);
}

/**
 * Rows the code view draws between two lines, which take no line of its
 * document: a {@link CodeBar}, a {@link CodeSpacer} or
 * {@link CodeEmbeddedLines}, and nothing else.
 *
 * @remarks
 * In 0.0.x their line is their owner's to remap after an edit.
 */
export type CodeInsertedRows = CodeBar | CodeSpacer | CodeEmbeddedLines;

/**
 * A button on a {@link CodeBar}; a click on it reaches the bar's owner as a
 * {@link CodeBarActionEvent} through `CodeEditorComponent.barAction`.
 */
export declare class CodeBarAction {
  /**
   * The owner's name for the action, which the event gives back.
   */
  readonly id: string;

  /**
   * The button's text.
   */
  readonly label: string;

  /**
   * The name of an icon of the kit's icon font, shown before the text, or
   * null for none.
   */
  readonly icon: string | null;

  /**
   * Creates an action.
   *
   * @param id The owner's name for the action.
   * @param label The button's text.
   * @param icon An icon's name, or null, when not given, for none.
   * @example
   * ```ts
   * import { CodeBarAction } from "@noldova/code.editor.angular";
   *
   * const take = new CodeBarAction("take", "Take", "check");
   * ```
   */
  constructor(id: string, label: string, icon?: string | null);
}

/**
 * A bar one row high across the code view between two lines, with an icon,
 * a note and actions, such as a merge conflict's choices.
 *
 * @remarks
 * Later fields come as optional constructor parameters at the end.
 */
export declare class CodeBar {
  /**
   * The line the rows come before, from 0; the document's line count puts
   * them after its last line.
   */
  readonly beforeLine: number;

  /**
   * The owner's name for the bar, which a {@link CodeBarActionEvent} gives
   * back.
   */
  readonly id: string;

  /**
   * The bar's text.
   */
  readonly note: string;

  /**
   * The name of an icon of the kit's icon font, shown before the note, or
   * null for none.
   */
  readonly icon: string | null;

  /**
   * The buttons at the bar's end, in order.
   */
  readonly actions: IReadOnlyList<CodeBarAction>;

  /**
   * The bar's CSS background, or null for the kit's code header color.
   */
  readonly background: string | null;

  /**
   * The bar's CSS text color, or null for the kit's muted text color.
   */
  readonly color: string | null;

  /**
   * Always 1.
   */
  get rowCount(): number;

  /**
   * Creates a bar.
   *
   * @param id The owner's name for the bar.
   * @param beforeLine The line the bar comes before, from 0.
   * @param note The bar's text.
   * @param icon An icon's name, or null for none.
   * @param actions The buttons at the bar's end.
   * @param background The bar's CSS background, or null, when not given, for
   * the default.
   * @param color The bar's CSS text color, or null, when not given, for the
   * default.
   * @throws {ArgumentOutOfRangeException} When `beforeLine` is negative or not a whole number.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { CodeBar, CodeBarAction, CodeDecorations, type CodeGutterMarker, type CodeInsertedRows, type CodeLineDecoration, type CodeRangeDecoration }
   *   from "@noldova/code.editor.angular";
   *
   * const bar = new CodeBar("conflict-1", 12, "Conflict 1 is open.", "warning", new List([new CodeBarAction("ours", "Ours")]));
   * const layer = new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([bar]));
   * ```
   */
  constructor(id: string, beforeLine: number, note: string, icon: string | null, actions: IReadOnlyList<CodeBarAction>, background?: string | null,
    color?: string | null);
}

/**
 * A click on a bar's action, which `CodeEditorComponent.barAction` gives
 * the bar's owner.
 */
export declare class CodeBarActionEvent {
  /**
   * The bar the action is on, as its owner gave it.
   */
  readonly bar: CodeBar;

  /**
   * The action clicked, as its owner gave it.
   */
  readonly action: CodeBarAction;

  /**
   * Creates the event, as the view does on a click.
   *
   * @param bar The bar the action is on.
   * @param action The action clicked.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { CodeBar, CodeBarAction, CodeBarActionEvent } from "@noldova/code.editor.angular";
   *
   * const ours = new CodeBarAction("ours", "Ours");
   * const bar = new CodeBar("conflict-1", 12, "Conflict 1 is open.", null, new List([ours]));
   * const event = new CodeBarActionEvent(bar, ours);
   * ```
   */
  constructor(bar: CodeBar, action: CodeBarAction);
}

/**
 * Filler rows between two lines, such as the shorter side of a change side
 * by side: striped, or painted with a background, with an optional gutter
 * sign.
 *
 * @remarks
 * Later fields come as optional constructor parameters at the end.
 */
export declare class CodeSpacer {
  /**
   * The line the rows come before, from 0; the document's line count puts
   * them after its last line.
   */
  readonly beforeLine: number;

  /**
   * How many rows it takes.
   */
  readonly rowCount: number;

  /**
   * The rows' CSS background, or null for the stripes of an empty row.
   */
  readonly background: string | null;

  /**
   * A sign in the rows' gutter cells, or null for none.
   */
  readonly sign: string | null;

  /**
   * The sign's CSS color, or null for the gutter's own color.
   */
  readonly signColor: string | null;

  /**
   * Creates filler rows.
   *
   * @param beforeLine The line the rows come before, from 0.
   * @param rowCount How many rows it takes.
   * @param background The rows' CSS background, or null, when not given, for
   * stripes.
   * @param sign A gutter sign, or null, when not given, for none.
   * @param signColor The sign's CSS color, or null, when not given, for the
   * gutter's own.
   * @throws {ArgumentOutOfRangeException} When `beforeLine` or `rowCount` is negative or not a whole number.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { CodeDecorations, type CodeGutterMarker, type CodeInsertedRows, type CodeLineDecoration, type CodeRangeDecoration, CodeSpacer }
   *   from "@noldova/code.editor.angular";
   *
   * const filler = new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(),
   *   new List<CodeInsertedRows>([new CodeSpacer(5, 2)]));
   * ```
   */
  constructor(beforeLine: number, rowCount: number, background?: string | null, sign?: string | null, signColor?: string | null);
}

/**
 * Lines of another document drawn read-only between two lines, such as the
 * removed lines of an inline diff, with their own tokens and decorations.
 * They are numbered by their own lines, in the second column when a layer
 * gives the view a second numbering.
 *
 * @remarks
 * Later fields come as optional constructor parameters at the end.
 */
export declare class CodeEmbeddedLines {
  /**
   * The line the rows come before, from 0; the document's line count puts
   * them after its last line.
   */
  readonly beforeLine: number;

  /**
   * The document the lines come from.
   */
  readonly document: TextDocument;

  /**
   * The document's first line shown, from 0.
   */
  readonly startLine: number;

  /**
   * How many of its lines show.
   */
  readonly lineCount: number;

  /**
   * The document's tokens, which color the lines, or null for plain text.
   */
  readonly tokens: TokenCache | null;

  /**
   * Decorations in the document's own lines, or null for none; their
   * inserted rows and numbering are not drawn.
   */
  readonly decorations: ICodeDecorations | null;

  /**
   * The number of lines shown.
   */
  get rowCount(): number;

  /**
   * Creates embedded lines.
   *
   * @param beforeLine The line they come before, from 0.
   * @param document The document they come from.
   * @param startLine Its first line shown, from 0.
   * @param lineCount How many of its lines show.
   * @param tokens Its tokens, or null, when not given, for plain text.
   * @param decorations Decorations in its own lines, or null, when not given,
   * for none.
   * @throws {ArgumentOutOfRangeException} When `beforeLine`, `startLine` or `lineCount` is negative or not a whole number.
   * @throws {ArgumentOutOfRangeException} When `startLine` plus `lineCount` passes the document's line count.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   * import { CodeDecorations, CodeEmbeddedLines, type CodeGutterMarker, type CodeInsertedRows, type CodeLineDecoration, type CodeRangeDecoration }
   *   from "@noldova/code.editor.angular";
   *
   * const removed = TextDocument.fromText("old line\n");
   * const layer = new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(),
   *   new List<CodeInsertedRows>([new CodeEmbeddedLines(3, removed, 0, 1)]));
   * ```
   */
  constructor(beforeLine: number, document: TextDocument, startLine: number, lineCount: number, tokens?: TokenCache | null,
    decorations?: ICodeDecorations | null);
}

/**
 * A second line number column, such as the original text's numbers in an
 * inline diff; the view shows it before its own numbers.
 */
export interface ICodeNumbering {
  /**
   * The largest number it gives, which sizes the gutter.
   */
  readonly largest: number;

  /**
   * Gives a line's number in the column.
   *
   * @param line A line of the view's document, from 0.
   * @returns The number to show, or null for none.
   * @example
   * ```ts
   * import type { ICodeNumbering } from "@noldova/code.editor.angular";
   *
   * class FromEleven implements ICodeNumbering {
   *   public readonly largest: number = 110;
   *
   *   public numberOf(line: number): number | null {
   *     return line + 11;
   *   }
   * }
   *
   * const fromEleven: ICodeNumbering = new FromEleven();
   * ```
   */
  numberOf(line: number): number | null;
}

/**
 * A layer of decorations on the code view, which asks it only for the lines
 * it draws, so a layer can compute them lazily; {@link CodeDecorations} is
 * the layer held in lists.
 *
 * @remarks
 * The view draws its layers in order, a later one over an earlier one. In
 * 0.0.x the positions are the layer's owner's to remap after an edit.
 *
 * The interface grows only by optional members, so a layer written for an
 * earlier version keeps compiling and drawing as it did.
 */
export interface ICodeDecorations {
  /**
   * The rows the layer inserts between lines.
   */
  readonly rows: IReadOnlyList<CodeInsertedRows>;

  /**
   * A second line number column, or null; the latest layer that has one
   * numbers the view.
   */
  readonly numbering: ICodeNumbering | null;

  /**
   * Gives the line decorations that reach a run of lines.
   *
   * @param start The run's first line, from 0.
   * @param end The line after the run.
   * @returns The line decorations, in the layer's order.
   * @example
   * ```ts
   * import { type IReadOnlyList, List } from "@noldova/context.collections";
   * import { type CodeGutterMarker, type CodeInsertedRows, CodeLineDecoration, type CodeRangeDecoration, type ICodeDecorations, type ICodeNumbering } from "@noldova/code.editor.angular";
   *
   * class EveryOtherLine implements ICodeDecorations {
   *   public readonly rows: IReadOnlyList<CodeInsertedRows> = new List<CodeInsertedRows>();
   *   public readonly numbering: ICodeNumbering | null = null;
   *
   *   public linesIn(start: number, end: number): IReadOnlyList<CodeLineDecoration> {
   *     const lines: List<CodeLineDecoration> = new List<CodeLineDecoration>();
   *     for (let line = start + start % 2; line < end; line += 2)
   *       lines.add(new CodeLineDecoration(line, 1, "var(--nol-code-header)"));
   *
   *     return lines;
   *   }
   *
   *   public rangesIn(): IReadOnlyList<CodeRangeDecoration> {
   *     return new List<CodeRangeDecoration>();
   *   }
   *
   *   public markersIn(): IReadOnlyList<CodeGutterMarker> {
   *     return new List<CodeGutterMarker>();
   *   }
   * }
   * ```
   */
  linesIn(start: number, end: number): IReadOnlyList<CodeLineDecoration>;

  /**
   * Gives the range decorations that reach a run of lines.
   *
   * @param start The run's first line, from 0.
   * @param end The line after the run.
   * @returns The range decorations, in the layer's order.
   * @example
   * ```ts
   * import { type IReadOnlyList, List } from "@noldova/context.collections";
   * import type { CodeRangeDecoration } from "@noldova/code.editor.angular";
   *
   * const matches: IReadOnlyList<CodeRangeDecoration> = new List<CodeRangeDecoration>();
   * const rangesIn = (start: number, end: number): IReadOnlyList<CodeRangeDecoration> =>
   *   matches.where(t => t.range.start.line < end && t.range.end.line >= start).toList();
   * ```
   */
  rangesIn(start: number, end: number): IReadOnlyList<CodeRangeDecoration>;

  /**
   * Gives the gutter markers on a run of lines.
   *
   * @param start The run's first line, from 0.
   * @param end The line after the run.
   * @returns The markers, in the layer's order; the last one on a line shows.
   * @example
   * ```ts
   * import { type IReadOnlyList, List } from "@noldova/context.collections";
   * import type { CodeGutterMarker } from "@noldova/code.editor.angular";
   *
   * const errors: IReadOnlyList<CodeGutterMarker> = new List<CodeGutterMarker>();
   * const markersIn = (start: number, end: number): IReadOnlyList<CodeGutterMarker> => errors.where(t => t.line >= start && t.line < end).toList();
   * ```
   */
  markersIn(start: number, end: number): IReadOnlyList<CodeGutterMarker>;
}

/**
 * A layer of decorations held in lists, indexed by line, so the view finds
 * the ones in view without reading the rest.
 *
 * @remarks
 * In 0.0.x its positions are its owner's to remap: after an edit, the owner
 * gives the view a new layer.
 */
export declare class CodeDecorations implements ICodeDecorations {
  /**
   * Its line decorations.
   */
  readonly lines: IReadOnlyList<CodeLineDecoration>;

  /**
   * Its range decorations.
   */
  readonly ranges: IReadOnlyList<CodeRangeDecoration>;

  /**
   * Its gutter markers.
   */
  readonly markers: IReadOnlyList<CodeGutterMarker>;

  /**
   * The rows it inserts between lines.
   */
  readonly rows: IReadOnlyList<CodeInsertedRows>;

  /**
   * Its second line number column, or null.
   */
  readonly numbering: ICodeNumbering | null;

  /**
   * Creates a layer; each part is empty, and the numbering null, when not
   * given.
   *
   * @param lines Its line decorations.
   * @param ranges Its range decorations.
   * @param markers Its gutter markers.
   * @param rows The rows it inserts between lines.
   * @param numbering Its second line number column, or null.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { CodeDecorations, CodeGutterMarker, CodeLineDecoration, type CodeRangeDecoration } from "@noldova/code.editor.angular";
   *
   * const warnings = new CodeDecorations(new List([new CodeLineDecoration(3, 1, "var(--nol-warning-background)")]), new List<CodeRangeDecoration>(),
   *   new List([new CodeGutterMarker(3, "!", "var(--nol-warning)")]));
   * ```
   */
  constructor(lines?: IReadOnlyList<CodeLineDecoration>, ranges?: IReadOnlyList<CodeRangeDecoration>, markers?: IReadOnlyList<CodeGutterMarker>,
    rows?: IReadOnlyList<CodeInsertedRows>, numbering?: ICodeNumbering | null);

  /**
   * Gives the line decorations that reach a run of lines.
   *
   * @param start The run's first line, from 0.
   * @param end The line after the run.
   * @returns The line decorations, in the order given.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { CodeDecorations, CodeLineDecoration } from "@noldova/code.editor.angular";
   *
   * const layer = new CodeDecorations(new List([new CodeLineDecoration(3, 2, "var(--nol-warning-background)")]));
   * const shown = layer.linesIn(0, 4);
   * const none = layer.linesIn(5, 10);
   * ```
   */
  linesIn(start: number, end: number): IReadOnlyList<CodeLineDecoration>;

  /**
   * Gives the range decorations that reach a run of lines.
   *
   * @param start The run's first line, from 0.
   * @param end The line after the run.
   * @returns The range decorations, in the order given.
   * @example
   * ```ts
   * import { TextPosition, TextRange } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   * import { CodeDecorations, type CodeLineDecoration, CodeRangeDecoration } from "@noldova/code.editor.angular";
   *
   * const layer = new CodeDecorations(new List<CodeLineDecoration>(),
   *   new List([new CodeRangeDecoration(new TextRange(new TextPosition(2, 4), new TextPosition(5, 0)), "var(--nol-list-highlight)")]));
   * const shown = layer.rangesIn(4, 8);
   * ```
   */
  rangesIn(start: number, end: number): IReadOnlyList<CodeRangeDecoration>;

  /**
   * Gives the gutter markers on a run of lines.
   *
   * @param start The run's first line, from 0.
   * @param end The line after the run.
   * @returns The markers, in the order given.
   * @example
   * ```ts
   * import { List } from "@noldova/context.collections";
   * import { CodeDecorations, CodeGutterMarker, type CodeLineDecoration, type CodeRangeDecoration } from "@noldova/code.editor.angular";
   *
   * const layer = new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List([new CodeGutterMarker(7, "!", "var(--nol-warning)")]));
   * const shown = layer.markersIn(0, 10);
   * ```
   */
  markersIn(start: number, end: number): IReadOnlyList<CodeGutterMarker>;
}

/**
 * A region of lines of the code view that collapses to one row.
 *
 * @remarks
 * The view shows a gutter toggle on a collapsed fold's row and on an
 * expanded fold's first line, and gives a click on either, or on the
 * collapsed row, to its owner through `CodeEditorComponent.foldToggle`; the
 * owner holds each fold's state and gives the view new folds when it
 * changes. A fold of no lines shows nothing. In 0.0.x its lines are its
 * owner's to remap after an edit.
 */
export declare class CodeFold {
  /**
   * The first line it holds, from 0.
   */
  readonly startLine: number;

  /**
   * How many lines it holds.
   */
  readonly lineCount: number;

  /**
   * Whether it shows as one row.
   */
  readonly collapsed: boolean;

  /**
   * The collapsed row's text, or null for a count of its lines.
   */
  readonly label: string | null;

  /**
   * Creates a fold.
   *
   * @param startLine The first line it holds, from 0.
   * @param lineCount How many lines it holds.
   * @param collapsed Whether it shows as one row.
   * @param label The collapsed row's text, or null, when not given, for a
   * count of its lines.
   * @throws {ArgumentOutOfRangeException} When `startLine` or `lineCount` is negative or not a whole number.
   * @example
   * ```ts
   * import { CodeFold } from "@noldova/code.editor.angular";
   *
   * const imports = new CodeFold(0, 12, true, "Imports");
   * ```
   */
  constructor(startLine: number, lineCount: number, collapsed: boolean, label?: string | null);
}

/**
 * The code view's CSS classes, each the bare class, which a host or a test
 * builds its selectors from.
 *
 * @example
 * ```ts
 * import { CodeEditorClasses } from "@noldova/code.editor.angular";
 *
 * document.querySelectorAll(`.${CodeEditorClasses.line}`);
 * CodeEditorClasses.token("keyword"); // "nol-code-editor-token-keyword"
 * ```
 */
export declare class CodeEditorClasses {
  /**
   * `nol-code-editor-line`: a line's text.
   */
  static readonly line: string;
  /**
   * `nol-code-editor-change`: a range decoration's mark, such as a changed range's.
   */
  static readonly change: string;
  /**
   * `nol-code-editor-line-number`: a line's gutter cell.
   */
  static readonly lineNumber: string;
  /**
   * `nol-code-editor-paint`: a line decoration's paint, on a row behind the text or in the gutter.
   */
  static readonly paint: string;
  /**
   * `nol-code-editor-row`: a row behind a line's text, which holds its paints.
   */
  static readonly row: string;
  /**
   * `nol-code-editor-row-spacer`: added to a row and a gutter cell that face an inserted filler row.
   */
  static readonly rowSpacer: string;
  /**
   * `nol-code-editor-row-fold`: added to a row and a gutter cell that face a folded region.
   */
  static readonly rowFold: string;
  /**
   * `nol-code-editor-line-fold`: added to the line that stands for a folded region.
   */
  static readonly lineFold: string;
  /**
   * `nol-code-editor-fold-toggle`: a fold's toggle.
   */
  static readonly foldToggle: string;
  /**
   * `nol-code-editor-fold-icon`: a fold toggle's icon.
   */
  static readonly foldIcon: string;
  /**
   * `nol-code-editor-scroller`: the scrolled area.
   */
  static readonly scroller: string;
  /**
   * `nol-code-editor-input`: the text input that takes keys.
   */
  static readonly input: string;
  /**
   * `nol-code-editor-caret`: a caret.
   */
  static readonly caret: string;
  /**
   * `nol-code-editor-match`: a search match's mark.
   */
  static readonly match: string;
  /**
   * `nol-code-editor-sign`: a gutter cell's change sign.
   */
  static readonly sign: string;
  /**
   * `nol-code-editor-number`: a gutter cell's line number.
   */
  static readonly number: string;
  /**
   * `nol-find-bar-field`: a field of the find bar, the find field first.
   */
  static readonly findField: string;

  /**
   * The class of a token of the type given.
   *
   * @param type The token type's id, such as `keyword`.
   * @returns `nol-code-editor-token-` and the type.
   * @example
   * ```ts
   * import { CodeEditorClasses } from "@noldova/code.editor.angular";
   *
   * CodeEditorClasses.token("comment"); // "nol-code-editor-token-comment"
   * ```
   */
  static token(type: string): string;
}

/**
 * The app's one set of editor registries, which every
 * {@link CodeEditorComponent} adds its own on top of.
 *
 * @remarks
 * It holds the core's contribution, with its built-in token types, and this
 * package's: the find, replace, close-find, fold and unfold commands and their
 * keys, and the `findVisible` condition. A host injects it to add user key
 * bindings, settings, token types or its own contributions; every view styles
 * its tokens by the token types here, whose rules it puts in the page.
 *
 * @example
 * ```ts
 * import { inject } from "@angular/core";
 * import { KeyBindingRule } from "@noldova/code.editor";
 * import { List } from "@noldova/context.collections";
 * import { CodeEditorRegistries } from "@noldova/code.editor.angular";
 *
 * inject(CodeEditorRegistries).registries.keyBindings.setUserRules(new List([new KeyBindingRule("editor.deleteRight", "ctrl+d")]));
 * ```
 */
export declare class CodeEditorRegistries {
  /**
   * The registries.
   */
  readonly registries: EditorRegistries;
  /**
   * Creates the set with the core's and this package's contributions; Angular
   * creates it once per app.
   *
   * @example
   * ```ts
   * import { CodeEditorRegistries } from "@noldova/code.editor.angular";
   *
   * const registries = new CodeEditorRegistries().registries;
   * ```
   */
  constructor();
}

/**
 * The `noldova-code-editor` component: the code view, which shows and edits
 * one {@link TextDocument}, drawing only the lines in view.
 *
 * @remarks
 * Every edit goes through the core: the view turns keys, paste, cut, drops
 * and composition into transactions on its document and records them in its
 * history. Its keys come from {@link CodeEditorRegistries}: each editor
 * takes a child of the app's set, so a host's bindings, settings and
 * contributions there reach every editor. Ctrl+F, or Cmd+F on Mac, opens its
 * find bar.
 *
 * Its element takes these custom properties, each with the interface kit's
 * value when unset: `--nol-code-editor-font-size` and
 * `--nol-code-editor-line-height` for its text,
 * `--nol-code-editor-gutter-width` for the gutter's least width,
 * `--nol-code-editor-gutter-end` for the space after the gutter's numbers,
 * `--nol-code-editor-signs`, which `none` hides the gutter's signs with, and
 * `--nol-code-editor-inset` for the space before the text.
 */
export declare class CodeEditorComponent {
  /**
   * The document the view shows and edits; required.
   */
  readonly document: InputSignal<TextDocument>;

  /**
   * The document's undo history, which the view's edits, undo and redo go
   * through; required.
   */
  readonly history: InputSignal<UndoHistory>;

  /**
   * The language that colors the code: its id in the app's
   * {@link CodeEditorRegistries}, its definition, or null, when not bound,
   * for plain text. The view finds the language's highlighter and makes its
   * tokenizer in the background, showing the text plain until it is ready,
   * and for good when no highlighter supports the language or its load fails.
   */
  readonly language: InputSignal<string | ILanguageDefinition | null>;

  /**
   * The view's accessible name, which screen readers read for its text box;
   * required.
   */
  readonly label: InputSignal<string>;

  /**
   * Whether the view refuses edits, drops and replacing; false when not
   * bound.
   */
  readonly readOnly: InputSignal<boolean>;

  /**
   * Whether Tab and Shift+Tab indent and outdent the selected lines, rather
   * than move the focus; false when not bound.
   */
  readonly tabIndents: InputSignal<boolean>;

  /**
   * The layers of decorations the view draws, in order, a later layer over
   * an earlier one; none when not bound.
   * In 0.0.x their positions are their owner's to remap after an edit.
   */
  readonly decorations: InputSignal<IReadOnlyList<ICodeDecorations>>;

  /**
   * The folds the view shows, collapsed or expanded, each with a gutter
   * toggle; none when not bound.
   */
  readonly folds: InputSignal<IReadOnlyList<CodeFold>>;

  /**
   * Emits the selections, primary first, after every change to the text or
   * the selections.
   */
  readonly selectionsChange: OutputEmitterRef<IReadOnlyList<TextSelection>>;

  /**
   * Emits the vertical scroll position, in pixels, after every scroll.
   */
  readonly scrollChange: OutputEmitterRef<number>;

  /**
   * Emits a fold whose row or toggle was clicked; the owner gives the view
   * the fold's new state.
   */
  readonly foldToggle: OutputEmitterRef<CodeFold>;

  /**
   * Emits each click on an action of a {@link CodeBar}.
   */
  readonly barAction: OutputEmitterRef<CodeBarActionEvent>;

  /**
   * Emits the chords of a key sequence the view waits to complete, as the
   * platform shows them, such as `"⌘K"` on a Mac and `"Ctrl+K"`
   * elsewhere, for the host to show; and null once the sequence completes or
   * drops, on a press no binding completes, Escape, a click or the loss of
   * the focus.
   */
  readonly keySequencePending: OutputEmitterRef<string | null>;

  /**
   * Creates the view, which Angular does for each `noldova-code-editor`
   * element.
   *
   * @example
   * ```ts
   * import { Component } from "@angular/core";
   * import { TextDocument, UndoHistory } from "@noldova/code.editor";
   * import { CodeEditorComponent } from "@noldova/code.editor.angular";
   *
   * @Component({
   *   selector: "app-source",
   *   imports: [CodeEditorComponent],
   *   template: "<noldova-code-editor [document]=\"document\" [history]=\"history\" label=\"Source\" />"
   * })
   * export class SourceComponent {
   *   protected readonly document: TextDocument = TextDocument.fromText("const a = 1;\n");
   *   protected readonly history: UndoHistory = new UndoHistory(this.document);
   * }
   * ```
   */
  constructor();

  /**
   * Moves the focus into the view's text box.
   *
   * @example
   * ```ts
   * import type { CodeEditorComponent } from "@noldova/code.editor.angular";
   *
   * function startEditing(view: CodeEditorComponent): void {
   *   view.focus();
   * }
   * ```
   */
  focus(): void;

  /**
   * Replaces the view's selections, the first one primary.
   *
   * @param selections The new selections, at least one.
   * @example
   * ```ts
   * import { TextPosition, TextSelection } from "@noldova/code.editor";
   * import { List } from "@noldova/context.collections";
   * import type { CodeEditorComponent } from "@noldova/code.editor.angular";
   *
   * function goToLine(view: CodeEditorComponent, line: number): void {
   *   view.select(new List([new TextSelection(new TextPosition(line, 0))]));
   * }
   * ```
   */
  select(selections: IReadOnlyList<TextSelection>): void;

  /**
   * Gives the position of the primary selection's caret.
   *
   * @returns The caret's line and column, both from 0.
   * @example
   * ```ts
   * import type { CodeEditorComponent } from "@noldova/code.editor.angular";
   *
   * function caretLine(view: CodeEditorComponent): number {
   *   return view.caret().line;
   * }
   * ```
   */
  caret(): TextPosition;

  /**
   * Tells whether the view's text box holds the focus.
   *
   * @returns True while the view has the focus.
   * @example
   * ```ts
   * import type { CodeEditorComponent } from "@noldova/code.editor.angular";
   *
   * function focusOnce(view: CodeEditorComponent): void {
   *   if (!view.hasFocus())
   *     view.focus();
   * }
   * ```
   */
  hasFocus(): boolean;

  /**
   * Draws the lines in view again with their current tokens, for a
   * tokenizer whose colors changed without an edit to the document.
   *
   * @example
   * ```ts
   * import type { CodeEditorComponent } from "@noldova/code.editor.angular";
   *
   * function recolor(view: CodeEditorComponent): void {
   *   view.refreshTokens();
   * }
   * ```
   */
  refreshTokens(): void;

  /**
   * Scrolls the view vertically.
   *
   * @param top The scroll position, in pixels from the first line; the view
   * clamps it to its scroll range.
   * @example
   * ```ts
   * import type { CodeEditorComponent } from "@noldova/code.editor.angular";
   *
   * function scrollToStart(view: CodeEditorComponent): void {
   *   view.scrollTo(0);
   * }
   * ```
   */
  scrollTo(top: number): void;
}
