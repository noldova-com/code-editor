/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { DiffSpan, EditorRegistries, IBackgroundJob, IBackgroundRunner, IDiffAlgorithm, IEditorContribution, SlicedRunner, TextDocument, TextRange } from "@noldova/code.editor";
import type { IReadOnlyList } from "@noldova/context.collections";

/**
 * Names one side of a two-document comparison.
 */
export declare enum DiffSide {
  /**
   * The original, left-hand document.
   */
  Original = "Original",
  /**
   * The modified, right-hand document.
   */
  Modified = "Modified"
}

/**
 * The character ranges that differ inside one changed block of lines, on
 * each side of a comparison.
 *
 * @remarks
 * {@link DocumentDiff} produces it for a {@link LineChange}. Both lists are
 * empty when either side of the block has no lines or the block is too large
 * for a character comparison.
 */
export declare class ChangeRanges {
  /**
   * The ranges in the original document that were removed or replaced, in
   * document order.
   */
  readonly original: IReadOnlyList<TextRange>;
  /**
   * The ranges in the modified document that were inserted or replaced, in
   * document order.
   */
  readonly modified: IReadOnlyList<TextRange>;
  /**
   * Creates a pair of range lists. The lists are stored as given, not copied.
   *
   * @param original The changed ranges in the original document.
   * @param modified The changed ranges in the modified document.
   * @example
   * ```ts
   * import { TextRange } from "@noldova/code.editor";
   * import { ChangeRanges } from "@noldova/code.editor.diff";
   * import { List } from "@noldova/context.collections";
   *
   * const ranges = new ChangeRanges(new List([TextRange.of(0, 4, 0, 7)]), new List([TextRange.of(0, 4, 0, 9)]));
   * ranges.modified.count(); // 1
   * ```
   */
  constructor(original: IReadOnlyList<TextRange>, modified: IReadOnlyList<TextRange>);
}

/**
 * One changed block of lines between an original and a modified document.
 *
 * @remarks
 * Lines are zero-based and each end is exclusive. An empty range on one side
 * means lines were only inserted or only removed, and its start is where they
 * would go.
 */
export declare class LineChange {
  /**
   * The change's zero-based position in its list of changes.
   */
  readonly index: number;
  /**
   * The first original line of the block.
   */
  readonly originalStart: number;
  /**
   * The original line after the block's last line.
   */
  readonly originalEnd: number;
  /**
   * The first modified line of the block.
   */
  readonly modifiedStart: number;
  /**
   * The modified line after the block's last line.
   */
  readonly modifiedEnd: number;
  /**
   * Creates a line change. The values are stored as given, not checked.
   *
   * @param index The change's zero-based position in its list.
   * @param originalStart The first original line, zero-based.
   * @param originalEnd The original end line, exclusive.
   * @param modifiedStart The first modified line, zero-based.
   * @param modifiedEnd The modified end line, exclusive.
   * @example
   * ```ts
   * import { LineChange } from "@noldova/code.editor.diff";
   *
   * const change = new LineChange(0, 2, 3, 2, 5);
   * change.originalLength; // 1
   * change.modifiedLength; // 3
   * ```
   */
  constructor(index: number, originalStart: number, originalEnd: number, modifiedStart: number, modifiedEnd: number);
  /**
   * The number of original lines in the block; zero for a pure insertion.
   */
  get originalLength(): number;
  /**
   * The number of modified lines in the block; zero for a pure removal.
   */
  get modifiedLength(): number;
  /**
   * Gives the block's first line on one side.
   *
   * @param side The side to read.
   * @returns {@link LineChange.originalStart} for {@link DiffSide.Original},
   * otherwise {@link LineChange.modifiedStart}.
   * @example
   * ```ts
   * import { DiffSide, LineChange } from "@noldova/code.editor.diff";
   *
   * new LineChange(0, 2, 3, 4, 6).startOf(DiffSide.Modified); // 4
   * ```
   */
  startOf(side: DiffSide): number;
  /**
   * Gives the block's exclusive end line on one side.
   *
   * @param side The side to read.
   * @returns {@link LineChange.originalEnd} for {@link DiffSide.Original},
   * otherwise {@link LineChange.modifiedEnd}.
   * @example
   * ```ts
   * import { DiffSide, LineChange } from "@noldova/code.editor.diff";
   *
   * new LineChange(0, 2, 3, 4, 6).endOf(DiffSide.Original); // 3
   * ```
   */
  endOf(side: DiffSide): number;
}

/**
 * A run of lines that are the same on both sides of a comparison, which a diff
 * view may fold. {@link DocumentDiff.unchangedRegions} produces them.
 * Immutable.
 *
 * @example
 * ```ts
 * import { UnchangedRegion } from "@noldova/code.editor.diff";
 *
 * const region = new UnchangedRegion(10, 12, 40);
 * ```
 */
export declare class UnchangedRegion {
  /**
   * The region's first zero-based line in the original text.
   */
  readonly originalStart: number;

  /**
   * The region's first zero-based line in the modified text.
   */
  readonly modifiedStart: number;

  /**
   * The number of lines in the region, the same on both sides.
   */
  readonly length: number;

  /**
   * Creates a region. Nothing is checked.
   *
   * @param originalStart The first zero-based line in the original text.
   * @param modifiedStart The first zero-based line in the modified text.
   * @param length The number of lines in the region.
   * @example
   * ```ts
   * import { UnchangedRegion } from "@noldova/code.editor.diff";
   *
   * const region = new UnchangedRegion(0, 0, 25);
   * ```
   */
  constructor(originalStart: number, modifiedStart: number, length: number);
}

/**
 * Packs line changes into a flat `Int32Array` and back, so they can cross a
 * worker boundary as a transferable buffer.
 *
 * @example
 * ```ts
 * import { LineChange, LineChangeCodec } from "@noldova/code.editor.diff";
 * import { List } from "@noldova/context.collections";
 *
 * const values = LineChangeCodec.encode(new List([new LineChange(0, 1, 2, 1, 3)]));
 * LineChangeCodec.decode(values).get(0).modifiedEnd; // 3
 * ```
 */
export declare class LineChangeCodec {
  /**
   * The values packed for each change: 4.
   */
  static readonly width: number;

  /**
   * Packs line changes, or any diff ranges.
   *
   * @param changes The changes, in order.
   * @returns Four values per change, in order: original start, original end,
   * modified start, modified end. Each change's index is not kept.
   * @example
   * ```ts
   * import { LineChange, LineChangeCodec } from "@noldova/code.editor.diff";
   * import { List } from "@noldova/context.collections";
   *
   * LineChangeCodec.encode(new List([new LineChange(0, 1, 2, 1, 3)])); // Int32Array [1, 2, 1, 3]
   * ```
   */
  static encode(changes: IReadOnlyList<DiffSpan>): Int32Array;

  /**
   * Packs some of the changes into values made for all of them, so that a
   * long list can be packed a slice at a time.
   *
   * @param values Four values per change of the whole list.
   * @param changes The whole list.
   * @param start The first change to pack.
   * @param end The change after the last to pack.
   * @example
   * ```ts
   * import { LineChange, LineChangeCodec } from "@noldova/code.editor.diff";
   * import { List } from "@noldova/context.collections";
   *
   * const changes = new List([new LineChange(0, 1, 2, 1, 3), new LineChange(1, 5, 6, 6, 6)]);
   * const values = new Int32Array(changes.count() * LineChangeCodec.width);
   * LineChangeCodec.encodeInto(values, changes, 1, 2); // Int32Array [0, 0, 0, 0, 5, 6, 6, 6]
   * ```
   */
  static encodeInto(values: Int32Array, changes: IReadOnlyList<DiffSpan>, start: number, end: number): void;

  /**
   * Unpacks line changes that {@link LineChangeCodec.encode} packed.
   *
   * @param values Four values per change; trailing values short of a full
   * change are ignored.
   * @returns The changes in their packed order, each indexed by its place in
   * the result.
   * @example
   * ```ts
   * import { LineChangeCodec } from "@noldova/code.editor.diff";
   *
   * LineChangeCodec.decode(new Int32Array([1, 2, 1, 3])).get(0).originalStart; // 1
   * ```
   */
  static decode(values: Int32Array): IReadOnlyList<LineChange>;
}

/**
 * Compares two documents line by line and keeps the result current as either
 * of them is edited.
 *
 * @remarks
 * Every comparison runs through an {@link IBackgroundRunner}: in the browser
 * the diff editor passes a worker runner, and the default is a
 * {@link SlicedRunner} on the calling thread. While a run is out,
 * {@link DocumentDiff.pending} is true and the last changes move through each
 * edit, so the marks stay on the lines they belong to while a person types.
 * One run is out at a time; a result for text edited meanwhile is dropped and
 * the documents are compared again. The line and character diffs come from
 * an {@link IDiffAlgorithm}, `@noldova/diff` by default. On the calling
 * thread the runner yields between slices around the algorithm's `lines`
 * call, not inside it. Dispose the diff to stop following the documents.
 *
 * @example
 * ```ts
 * import { TextDocument } from "@noldova/code.editor";
 * import { DocumentDiff } from "@noldova/code.editor.diff";
 *
 * using diff = new DocumentDiff(TextDocument.fromText("a\nb"), TextDocument.fromText("a\nc"));
 * await diff.settledAsync();
 * diff.changes.count(); // 1
 * ```
 */
export declare class DocumentDiff implements Disposable {
  /**
   * The document on the original side; the diff only reads it.
   */
  readonly original: TextDocument;

  /**
   * The document on the modified side; the diff only reads it.
   */
  readonly modified: TextDocument;

  /**
   * The algorithm that finds the changed lines and characters.
   */
  readonly algorithm: IDiffAlgorithm;

  /**
   * Starts comparing two documents and following their edits.
   *
   * @param original The document on the original side.
   * @param modified The document on the modified side.
   * @param algorithm The diff algorithm. Defaults to a
   * {@link DefaultDiffAlgorithm}, which uses `@noldova/diff`.
   * @param runner Where the line diff runs. Defaults to a
   * {@link SlicedRunner} on the calling thread; a worker runner keeps the
   * screen free while large documents are compared.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { DocumentDiff } from "@noldova/code.editor.diff";
   *
   * using diff = new DocumentDiff(TextDocument.fromText("a"), TextDocument.fromText("b"));
   * ```
   */
  constructor(original: TextDocument, modified: TextDocument, algorithm?: IDiffAlgorithm, runner?: IBackgroundRunner);

  /**
   * The current changed line ranges, in document order. It is empty until the
   * first run lands. A new array replaces it after each edit, moved through
   * the edit, and again when the next run lands.
   */
  get changes(): IReadOnlyList<LineChange>;

  /**
   * True while a run is out, so that {@link DocumentDiff.changes} may be the
   * last result moved through the edits since.
   */
  get pending(): boolean;

  /**
   * True when the last run failed, such as when its algorithm threw. The
   * changes then stay as they were moved through the edits, and the next edit
   * runs the diff again.
   */
  get failed(): boolean;

  /**
   * The most characters, both sides of a change together, that
   * {@link DocumentDiff.rangesOf} compares; a longer change gets no
   * changed-character ranges. Defaults to 20,000. Setting another value drops
   * the cached ranges and tells the listeners.
   */
  get characterDiffLimit(): number;
  set characterDiffLimit(value: number);

  /**
   * Waits until no run is out.
   *
   * @returns A promise that settles once {@link DocumentDiff.pending} is
   * false or the diff is disposed; at once when no run is out.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { DocumentDiff } from "@noldova/code.editor.diff";
   *
   * using diff = new DocumentDiff(TextDocument.fromText("a"), TextDocument.fromText("b"));
   * await diff.settledAsync();
   * diff.pending; // false
   * ```
   */
  settledAsync(): Promise<void>;

  /**
   * Finds the changed characters inside one changed line range.
   *
   * @param change A change from {@link DocumentDiff.changes}.
   * @returns The changed character ranges on each side, cached until the
   * diff next changes. Both lists are empty when either side of the
   * change has no lines or the two sides together exceed {@link DocumentDiff.characterDiffLimit}.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { DocumentDiff } from "@noldova/code.editor.diff";
   *
   * using diff = new DocumentDiff(TextDocument.fromText("cat"), TextDocument.fromText("car"));
   * diff.rangesOf(diff.changes.get(0)).modified; // the range 0:2 to 0:3
   * ```
   */
  rangesOf(change: LineChange): ChangeRanges;

  /**
   * Finds the change that covers a line on one side.
   *
   * @param line The zero-based line on that side.
   * @param side The side the line is on.
   * @returns The change whose lines on that side include the line, or `null`
   * when the line is unchanged. A change with no lines on that side covers
   * nothing there.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { DiffSide, DocumentDiff } from "@noldova/code.editor.diff";
   *
   * using diff = new DocumentDiff(TextDocument.fromText("a\nb"), TextDocument.fromText("a\nc"));
   * diff.changeAt(1, DiffSide.Original); // the change
   * diff.changeAt(0, DiffSide.Original); // null
   * ```
   */
  changeAt(line: number, side: DiffSide): LineChange | null;

  /**
   * Finds the next change, for a Next Change command.
   *
   * @param line The zero-based line on that side to search after.
   * @param side The side the line is on.
   * @returns The first change that starts after the line, or the first
   * change when none does, wrapping around; `null` when there are no changes.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { DiffSide, DocumentDiff } from "@noldova/code.editor.diff";
   *
   * using diff = new DocumentDiff(TextDocument.fromText("a\nb"), TextDocument.fromText("x\nb"));
   * diff.changeAfter(0, DiffSide.Modified); // the change at line 0, wrapped around
   * ```
   */
  changeAfter(line: number, side: DiffSide): LineChange | null;

  /**
   * Finds the previous change, for a Previous Change command.
   *
   * @param line The zero-based line on that side to search before.
   * @param side The side the line is on.
   * @returns The last change that starts before the line, or the last change
   * when none does, wrapping around; `null` when there are no changes.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { DiffSide, DocumentDiff } from "@noldova/code.editor.diff";
   *
   * using diff = new DocumentDiff(TextDocument.fromText("a\nb"), TextDocument.fromText("a\nc"));
   * diff.changeBefore(5, DiffSide.Modified); // the change at line 1
   * ```
   */
  changeBefore(line: number, side: DiffSide): LineChange | null;

  /**
   * Finds the runs of unchanged lines that a view can fold away.
   *
   * @param context The unchanged lines to keep visible next to each change.
   * No lines are kept before the first change's region at the document's
   * start or after the last change's region at its end.
   * @param minimum The fewest lines a region must hide to be listed.
   * @returns The foldable regions in document order, each with its start on
   * both sides and its length in lines; empty when there are no changes.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { DocumentDiff } from "@noldova/code.editor.diff";
   *
   * const same = Array.from({ length: 10 }, (_, i) => `line ${i}`).join("\n");
   * using diff = new DocumentDiff(TextDocument.fromText(same + "\nold"), TextDocument.fromText(same + "\nnew"));
   * diff.unchangedRegions(3, 1); // one region hiding 7 lines from line 0
   * ```
   */
  unchangedRegions(context: number, minimum: number): IReadOnlyList<UnchangedRegion>;

  /**
   * Subscribes to updates of the diff.
   *
   * @param listener Called after the changes are recomputed: after each edit
   * to either document, and when a run lands or fails, and when the character limit changes.
   * @returns A function that unsubscribes the listener.
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { DocumentDiff } from "@noldova/code.editor.diff";
   *
   * using diff = new DocumentDiff(TextDocument.fromText("a"), TextDocument.fromText("b"));
   * const stop = diff.onChange(() => console.log(diff.changes.count()));
   * stop();
   * ```
   */
  onChange(listener: () => void): () => void;

  /**
   * Stops following both documents' edits; a run still out is canceled and
   * its result ignored.
   *
   * @example
   * ```ts
   * import { TextDocument } from "@noldova/code.editor";
   * import { DocumentDiff } from "@noldova/code.editor.diff";
   *
   * const diff = new DocumentDiff(TextDocument.fromText("a"), TextDocument.fromText("b"));
   * diff[Symbol.dispose]();
   * ```
   */
  [Symbol.dispose](): void;
}

/**
 * The default diff algorithm, `@noldova/diff`'s `TextDiff`.
 *
 * @example
 * ```ts
 * import { DefaultDiffAlgorithm } from "@noldova/code.editor.diff";
 * import { List } from "@noldova/context.collections";
 *
 * new DefaultDiffAlgorithm().lines(new List(["a", "b"]), new List(["a", "c"])).count(); // 1
 * ```
 */
export declare class DefaultDiffAlgorithm implements IDiffAlgorithm {
  /**
   * `noldova.diff`.
   */
  readonly id: string;

  /**
   * Finds the changed line ranges with `TextDiff.lines`.
   *
   * @param original The lines before.
   * @param modified The lines after.
   * @returns The changes in order and apart; none for equal sequences.
   * @example
   * ```ts
   * import { DefaultDiffAlgorithm } from "@noldova/code.editor.diff";
   * import { List } from "@noldova/context.collections";
   *
   * new DefaultDiffAlgorithm().lines(new List(["a"]), new List(["a"])).count(); // 0
   * ```
   */
  lines(original: IReadOnlyList<string>, modified: IReadOnlyList<string>): IReadOnlyList<DiffSpan>;

  /**
   * Finds the changed character ranges with `TextDiff.characters`.
   *
   * @param original The text before.
   * @param modified The text after.
   * @returns The changes in order and apart, never splitting a surrogate
   * pair.
   * @example
   * ```ts
   * import { DefaultDiffAlgorithm } from "@noldova/code.editor.diff";
   *
   * new DefaultDiffAlgorithm().characters("cat", "cut").get(0).originalStart; // 1
   * ```
   */
  characters(original: string, modified: string): IReadOnlyList<DiffSpan>;
}

/**
 * The two line sequences a {@link LineDiffJob} compares. It holds only
 * arrays of strings, so it crosses to a worker as it is.
 *
 * @example
 * ```ts
 * import { LineDiffInput } from "@noldova/code.editor.diff";
 *
 * new LineDiffInput(["a"], ["b"]).modified; // ["b"]
 * ```
 */
export declare class LineDiffInput {
  /**
   * The lines before.
   */
  readonly original: readonly string[];

  /**
   * The lines after.
   */
  readonly modified: readonly string[];

  /**
   * Holds the two sequences.
   *
   * @param original The lines before.
   * @param modified The lines after.
   * @example
   * ```ts
   * import { LineDiffInput } from "@noldova/code.editor.diff";
   *
   * new LineDiffInput(["a"], ["b"]);
   * ```
   */
  constructor(original: readonly string[], modified: readonly string[]);
}

/**
 * The diff model's contribution: the default algorithm and its
 * {@link LineDiffJob}, in the registries' `diffAlgorithms` and
 * `backgroundJobs`.
 *
 * @example
 * ```ts
 * import { EditorRegistries } from "@noldova/code.editor";
 * import { DiffContribution } from "@noldova/code.editor.diff";
 *
 * const registries = new EditorRegistries();
 * registries.add(new DiffContribution());
 * registries.diffAlgorithms.current().id; // "noldova.diff"
 * ```
 */
export declare class DiffContribution implements IEditorContribution {
  /**
   * `"noldova.code.editor.diff"`.
   */
  readonly id: string;

  /**
   * Registers the default algorithm and its line diff job.
   *
   * @param registries The set to register them in.
   * @example
   * ```ts
   * import { EditorRegistries } from "@noldova/code.editor";
   * import { DiffContribution } from "@noldova/code.editor.diff";
   *
   * new DiffContribution().contribute(new EditorRegistries());
   * ```
   */
  contribute(registries: EditorRegistries): void;
}

/**
 * The background job that runs an algorithm's line diff and packs the result
 * with {@link LineChangeCodec}, so it crosses back from a worker without a
 * copy.
 *
 * @remarks
 * Its steps yield before the diff and between slices of the packing; the
 * algorithm's `lines` call itself is one step. A worker script serves it by
 * its name; the diff editor package's worker serves the default algorithm's.
 *
 * @example
 * ```ts
 * import { SlicedRunner } from "@noldova/code.editor";
 * import { DefaultDiffAlgorithm, LineChangeCodec, LineDiffInput, LineDiffJob } from "@noldova/code.editor.diff";
 *
 * const values = await new SlicedRunner().runAsync(new LineDiffJob(new DefaultDiffAlgorithm()), new LineDiffInput(["a"], ["b"]));
 * LineChangeCodec.decode(values).count(); // 1
 * ```
 */
export declare class LineDiffJob implements IBackgroundJob<LineDiffInput, Int32Array> {
  /**
   * `code.editor.diff.lines:` and the algorithm's id.
   */
  readonly name: string;

  /**
   * Makes the job for an algorithm.
   *
   * @param algorithm The algorithm whose `lines` the job runs.
   * @example
   * ```ts
   * import { DefaultDiffAlgorithm, LineDiffJob } from "@noldova/code.editor.diff";
   *
   * new LineDiffJob(new DefaultDiffAlgorithm()).name; // "code.editor.diff.lines:noldova.diff"
   * ```
   */
  constructor(algorithm: IDiffAlgorithm);

  /**
   * The job's steps, for a runner to drive.
   *
   * @param input The sequences to compare.
   * @returns A generator that yields between slices and returns the packed
   * changes.
   * @example
   * ```ts
   * import { DefaultDiffAlgorithm, LineDiffInput, LineDiffJob } from "@noldova/code.editor.diff";
   *
   * const steps = new LineDiffJob(new DefaultDiffAlgorithm()).steps(new LineDiffInput(["a"], ["a"]));
   * ```
   */
  steps(input: LineDiffInput): Generator<void, Int32Array, void>;
}
