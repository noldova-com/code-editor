/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { Exception } from "@noldova/context.exceptions";
import type { TextChange, TextDocument, UndoHistory } from "@noldova/code.editor";
import type { IReadOnlyList } from "@noldova/context.collections";

/**
 * Names the ways one merge conflict can be resolved from its two sides.
 *
 * @remarks
 * {@link MergeConflict.choiceText} turns a choice into the text it stands
 * for, and {@link MergeDocument.accept} writes that text into the conflict.
 * When both sides are kept, they are joined with a line feed unless either
 * side is empty or the first already ends with a line break.
 */
export declare enum ConflictChoice {
  /**
   * Keeps only our side of the conflict.
   */
  Ours = "Ours",
  /**
   * Keeps only their side of the conflict.
   */
  Theirs = "Theirs",
  /**
   * Keeps both sides, ours before theirs.
   */
  BothOursFirst = "BothOursFirst",
  /**
   * Keeps both sides, theirs before ours.
   */
  BothTheirsFirst = "BothTheirsFirst"
}

/**
 * Describes what a merge conflict's current text matches.
 *
 * @remarks
 * {@link MergeConflict.stateFor} compares the text in this order: the
 * suggestion, ours, theirs, both ours first, both theirs first, and then the
 * base; text that matches none of them is {@link ConflictState.Edited}.
 */
export declare enum ConflictState {
  /**
   * The text still equals the conflict's base text.
   */
  Unresolved = "Unresolved",
  /**
   * The text equals our side.
   */
  Ours = "Ours",
  /**
   * The text equals their side.
   */
  Theirs = "Theirs",
  /**
   * The text equals both sides joined, ours first.
   */
  BothOursFirst = "BothOursFirst",
  /**
   * The text equals both sides joined, theirs first.
   */
  BothTheirsFirst = "BothTheirsFirst",
  /**
   * The text equals the suggestion set on the conflict.
   */
  Suggested = "Suggested",
  /**
   * The text matches neither side, their combinations, the suggestion nor
   * the base: it was edited by hand.
   */
  Edited = "Edited"
}

/**
 * Reports merged text whose conflict markers don't form valid conflicts, such
 * as a marker out of place or a conflict that is never closed.
 *
 * @remarks
 * {@link MergeDocument.fromMarkers} throws it, and
 * {@link MergeDocument.readMarkers} returns it instead of throwing.
 */
export declare class ConflictMarkersException extends Exception {
  /**
   * `ConflictMarkersException`.
   */
  readonly name: string;

  /**
   * The one-based line number where the markers stop parsing.
   */
  readonly line: number;
  /**
   * Creates the exception with the message
   * "The conflict markers don't parse at line `line`: `reason`."
   *
   * @param line The one-based line number of the faulty marker, or of the
   * conflict that is never closed.
   * @param reason A short reason without a final period; the message adds it.
   * @example
   * ```ts
   * import { ConflictMarkersException, MergeDocument } from "@noldova/code.editor.merge";
   *
   * const result = MergeDocument.readMarkers("a\n<<<<<<< HEAD\nX\n");
   * if (result instanceof ConflictMarkersException)
   *   console.log(result.line); // 2
   * ```
   */
  constructor(line: number, reason: string);
}

/**
 * One conflict of a three-way merge: the base text and both sides' texts,
 * where it sits in the merged document, and an optional suggested
 * resolution.
 *
 * @remarks
 * {@link MergeDocument} keeps the conflict's position current with
 * {@link MergeConflict.moveTo} as the document changes.
 */
export declare class MergeConflict {
  /**
   * The conflict's zero-based position in its document's list of conflicts.
   */
  readonly index: number;
  /**
   * The common ancestor's text of the conflict.
   */
  readonly base: string;
  /**
   * Our side's text of the conflict.
   */
  readonly ours: string;
  /**
   * Their side's text of the conflict.
   */
  readonly theirs: string;
  /**
   * Creates a conflict with no suggestion.
   *
   * @param index The conflict's zero-based position in its list.
   * @param base The common ancestor's text.
   * @param ours Our side's text.
   * @param theirs Their side's text.
   * @param start The zero-based character offset where the conflict starts in
   * the merged document.
   * @param end The exclusive character offset where it ends.
   * @example
   * ```ts
   * import { MergeConflict } from "@noldova/code.editor.merge";
   *
   * const conflict = new MergeConflict(0, "b\n", "X\n", "Y\n", 0, 2);
   * ```
   */
  constructor(index: number, base: string, ours: string, theirs: string, start: number, end: number);
  /**
   * The zero-based character offset where the conflict starts in the merged
   * document; changes with {@link MergeConflict.moveTo}.
   */
  get start(): number;
  /**
   * The exclusive character offset where the conflict ends in the merged
   * document; changes with {@link MergeConflict.moveTo}.
   */
  get end(): number;
  /**
   * The suggested resolution, or `null` until {@link MergeConflict.suggest}
   * sets one.
   */
  get suggestion(): string | null;
  /**
   * Moves the conflict to a new place in the merged document.
   *
   * @param start The new zero-based start offset.
   * @param end The new exclusive end offset.
   * @example
   * ```ts
   * import { MergeConflict } from "@noldova/code.editor.merge";
   *
   * const conflict = new MergeConflict(0, "b\n", "X\n", "Y\n", 0, 2);
   * conflict.moveTo(4, 6);
   * conflict.start; // 4
   * ```
   */
  moveTo(start: number, end: number): void;
  /**
   * Sets the suggested resolution, replacing any earlier one.
   *
   * @param text The suggested text for the conflict.
   * @example
   * ```ts
   * import { MergeConflict } from "@noldova/code.editor.merge";
   *
   * const conflict = new MergeConflict(0, "b\n", "X\n", "Y\n", 0, 2);
   * conflict.suggest("XY\n");
   * conflict.suggestion; // "XY\n"
   * ```
   */
  suggest(text: string): void;
  /**
   * Gives the text a choice resolves the conflict to.
   *
   * @param choice The resolution to take.
   * @returns Our text, their text, or both joined in the chosen order. When
   * both are joined and neither is empty, a line feed is put between them
   * unless the first already ends with a line ending.
   * @example
   * ```ts
   * import { ConflictChoice, MergeConflict } from "@noldova/code.editor.merge";
   *
   * const conflict = new MergeConflict(0, "b", "X", "Y", 0, 1);
   * conflict.choiceText(ConflictChoice.BothTheirsFirst); // "Y\nX"
   * ```
   */
  choiceText(choice: ConflictChoice): string;
  /**
   * Classifies the conflict's current text.
   *
   * @param text The text the conflict's range now holds.
   * @returns {@link ConflictState.Suggested} when it equals the suggestion;
   * otherwise the first match of our text, their text, both ours first, and
   * both theirs first; otherwise {@link ConflictState.Unresolved} when it is
   * still the base text, or {@link ConflictState.Edited}.
   * @example
   * ```ts
   * import { ConflictState, MergeConflict } from "@noldova/code.editor.merge";
   *
   * const conflict = new MergeConflict(0, "b\n", "X\n", "Y\n", 0, 2);
   * conflict.stateFor("Y\n") === ConflictState.Theirs; // true
   * conflict.stateFor("b\n") === ConflictState.Unresolved; // true
   * ```
   */
  stateFor(text: string): ConflictState;
}

/**
 * A three-way merge being resolved: a document holding the merged text and its
 * conflicts, which follow the edits made to it.
 *
 * @remarks
 * Each conflict starts out holding its base text. A conflict is resolved by
 * accepting a side, by setting its text, or by editing the document; its
 * state is worked out from the text it holds at the time. Every edit goes
 * through {@link MergeDocument.history}, so each can be undone.
 *
 * @example
 * ```ts
 * import { ConflictChoice, MergeDocument } from "@noldova/code.editor.merge";
 *
 * const merge = MergeDocument.fromSides("a\n", "b\n", "c\n");
 * merge.unresolvedCount(); // 1
 * merge.accept(0, ConflictChoice.Theirs, Date.now());
 * merge.document.text(); // "c\n"
 * ```
 */
export declare class MergeDocument {
  /**
   * The merged text being resolved. Editing it directly also moves the
   * conflicts, but bypasses the undo history.
   */
  readonly document: TextDocument;

  /**
   * The undo history of {@link MergeDocument.document}, which every edit made
   * through this merge goes into.
   */
  readonly history: UndoHistory;

  private constructor();

  /**
   * Merges three versions of a text line by line.
   *
   * @param base The common ancestor.
   * @param ours Our version.
   * @param theirs Their version.
   * @returns A merge whose text takes each region changed on one side only
   * from that side, and holds the base text in each region changed on both
   * sides, which becomes a conflict.
   * @example
   * ```ts
   * import { MergeDocument } from "@noldova/code.editor.merge";
   *
   * const merge = MergeDocument.fromSides("a\nb\n", "A\nb\n", "a\nB\n");
   * merge.conflicts.count(); // 0: each line changed on one side only.
   * merge.document.text(); // "A\nB\n"
   * ```
   */
  static fromSides(base: string, ours: string, theirs: string): MergeDocument;

  /**
   * Reads a text with conflict markers, failing on a malformed one.
   *
   * @param merged Text with `<<<<<<<`, `|||||||`, `=======` and `>>>>>>>`
   * marker lines; a conflict without the base section has an empty base.
   * @returns A merge whose text keeps the lines outside the markers and holds
   * each conflict's base text in its place.
   * @throws {ConflictMarkersException} When a marker is out of order or a
   * conflict is never closed.
   * @example
   * ```ts
   * import { MergeDocument } from "@noldova/code.editor.merge";
   *
   * const merge = MergeDocument.fromMarkers("<<<<<<< ours\nb\n=======\nc\n>>>>>>> theirs\n");
   * merge.conflicts.get(0).ours; // "b\n"
   * ```
   */
  static fromMarkers(merged: string): MergeDocument;

  /**
   * Reads a text with conflict markers, returning the failure instead of
   * throwing it.
   *
   * @param merged Text with conflict marker lines, as {@link MergeDocument.fromMarkers} reads it.
   * @returns The merge, or the {@link ConflictMarkersException} that
   * {@link MergeDocument.fromMarkers} would throw, naming the 1-based line.
   * @example
   * ```ts
   * import { ConflictMarkersException, MergeDocument } from "@noldova/code.editor.merge";
   *
   * const read = MergeDocument.readMarkers("<<<<<<< ours\nb\n");
   * if (read instanceof ConflictMarkersException)
   *   console.log(read.line); // 1: the unclosed conflict's first line.
   * ```
   */
  static readMarkers(merged: string): MergeDocument | ConflictMarkersException;

  /**
   * The conflicts, in document order; each one's index is its place in this
   * list. The list never changes, but each conflict's offsets move with the
   * document's edits.
   */
  get conflicts(): IReadOnlyList<MergeConflict>;

  /**
   * Reads the text a conflict holds now.
   *
   * @param index The conflict's index in {@link MergeDocument.conflicts}.
   * @returns The document text between the conflict's current offsets.
   * @throws {ArgumentOutOfRangeException} When no conflict has that index.
   * @example
   * ```ts
   * import { MergeDocument } from "@noldova/code.editor.merge";
   *
   * MergeDocument.fromSides("a\n", "b\n", "c\n").conflictText(0); // "a\n": the base.
   * ```
   */
  conflictText(index: number): string;

  /**
   * Works out how a conflict stands from the text it holds.
   *
   * @param index The conflict's index in {@link MergeDocument.conflicts}.
   * @returns {@link ConflictState.Suggested} when the text equals the last
   * text set with {@link MergeDocument.setConflictText}; otherwise the side or
   * combination it equals, {@link ConflictState.Unresolved} for the base, or
   * {@link ConflictState.Edited} for anything else.
   * @throws {ArgumentOutOfRangeException} When no conflict has that index.
   * @example
   * ```ts
   * import { ConflictChoice, MergeDocument } from "@noldova/code.editor.merge";
   *
   * const merge = MergeDocument.fromSides("a\n", "b\n", "c\n");
   * merge.accept(0, ConflictChoice.Ours, 0);
   * merge.stateOf(0); // ConflictState.Ours
   * ```
   */
  stateOf(index: number): ConflictState;

  /**
   * Counts the unresolved conflicts: those that hold their base text and match
   * no suggestion, side or combination, so base text equal to ours counts as
   * resolved.
   *
   * @returns The number of conflicts whose state is
   * {@link ConflictState.Unresolved}; zero when the merge is resolved.
   * @example
   * ```ts
   * import { MergeDocument } from "@noldova/code.editor.merge";
   *
   * MergeDocument.fromSides("a\n", "b\n", "c\n").unresolvedCount(); // 1
   * ```
   */
  unresolvedCount(): number;

  /**
   * Finds the conflict at an offset.
   *
   * @param offset An offset in the document, in UTF-16 code units.
   * @returns The index of the first conflict whose current start is at or
   * before the offset and whose end is at or after it, both ends inclusive;
   * null when none is.
   * @example
   * ```ts
   * import { MergeDocument } from "@noldova/code.editor.merge";
   *
   * const merge = MergeDocument.fromSides("a\n", "b\n", "c\n");
   * merge.conflictAt(0); // 0
   * merge.conflictAt(9); // null
   * ```
   */
  conflictAt(offset: number): number | null;

  /**
   * Replaces a conflict's text with a side or a combination of both sides.
   *
   * @param index The conflict's index in {@link MergeDocument.conflicts}.
   * @param choice The side or combination to take. The combinations put a
   * line feed between the sides when the first one doesn't end in a line ending.
   * @param time The edit's time in milliseconds, kept in the undo history.
   * @returns The document change; undoing it restores the previous text.
   * @throws {ArgumentOutOfRangeException} When no conflict has that index.
   * @example
   * ```ts
   * import { ConflictChoice, MergeDocument } from "@noldova/code.editor.merge";
   *
   * const merge = MergeDocument.fromSides("a\n", "b\n", "c\n");
   * merge.accept(0, ConflictChoice.BothOursFirst, Date.now());
   * merge.document.text(); // "b\nc\n"
   * ```
   */
  accept(index: number, choice: ConflictChoice, time: number): TextChange;

  /**
   * Replaces every unresolved conflict's text with a side or a combination, as
   * one change.
   *
   * @param choice The side or combination to take for each unresolved conflict.
   * @param time The edit's time in milliseconds, kept in the undo history.
   * @returns The document change, undone as one step; null when no conflict
   * is unresolved, leaving the document unchanged.
   * @example
   * ```ts
   * import { ConflictChoice, MergeDocument } from "@noldova/code.editor.merge";
   *
   * const merge = MergeDocument.fromSides("a\n", "b\n", "c\n");
   * merge.acceptAll(ConflictChoice.Ours, Date.now());
   * merge.acceptAll(ConflictChoice.Ours, Date.now()); // null: none left.
   * ```
   */
  acceptAll(choice: ConflictChoice, time: number): TextChange | null;

  /**
   * Sets a conflict's text, such as a suggested resolution, and remembers it
   * as the conflict's suggestion.
   *
   * @param index The conflict's index in {@link MergeDocument.conflicts}.
   * @param text The resolved text; while the conflict holds it, its state is
   * {@link ConflictState.Suggested}.
   * @param time The edit's time in milliseconds, kept in the undo history.
   * @returns The document change.
   * @throws {ArgumentOutOfRangeException} When no conflict has that index.
   * @example
   * ```ts
   * import { MergeDocument } from "@noldova/code.editor.merge";
   *
   * const merge = MergeDocument.fromSides("a\n", "b\n", "c\n");
   * merge.setConflictText(0, "bc\n", Date.now());
   * merge.stateOf(0); // ConflictState.Suggested
   * ```
   */
  setConflictText(index: number, text: string, time: number): TextChange;

  /**
   * Puts a conflict's base text back, which makes it unresolved again unless
   * the base equals one of its sides or its suggestion.
   *
   * @param index The conflict's index in {@link MergeDocument.conflicts}.
   * @param time The edit's time in milliseconds, kept in the undo history.
   * @returns The document change; a change is made even when the text was
   * already the base.
   * @throws {ArgumentOutOfRangeException} When no conflict has that index.
   * @example
   * ```ts
   * import { ConflictChoice, MergeDocument } from "@noldova/code.editor.merge";
   *
   * const merge = MergeDocument.fromSides("a\n", "b\n", "c\n");
   * merge.accept(0, ConflictChoice.Ours, 0);
   * merge.reset(0, 1);
   * merge.unresolvedCount(); // 1
   * ```
   */
  reset(index: number, time: number): TextChange;
}
