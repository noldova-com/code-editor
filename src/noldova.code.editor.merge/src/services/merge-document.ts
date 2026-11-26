/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type AppliedEdit, EditKind, EditTransaction, LineSplit, type TextChange, TextDocument, TextEdit, TextPosition, TextRange, TextSelection, UndoHistory } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";
import { Merge3, MergeRegionKind } from "@noldova/diff";

import { ConflictChoice } from "../enums/conflict-choice.js";
import { ConflictState } from "../enums/conflict-state.js";
import { ConflictMarkersException } from "../exceptions/conflict-markers.exception.js";
import { MergeConflict } from "../models/merge-conflict.js";
import { MergeStart } from "../models/merge-start.js";
import { ConflictMarkers } from "./conflict-markers.js";

export class MergeDocument {
  public readonly document: TextDocument;
  public readonly history: UndoHistory;
  private readonly conflictList: IReadOnlyList<MergeConflict>;

  private constructor(start: MergeStart) {
    this.document = TextDocument.fromText(start.text);
    this.history = new UndoHistory(this.document);
    this.conflictList = start.conflicts;
    this.document.onChange(t => this.follow(t));
  }

  public static fromSides(base: string, ours: string, theirs: string): MergeDocument {
    const baseLines: readonly string[] = MergeDocument.lines(base);
    const oursLines: readonly string[] = MergeDocument.lines(ours);
    const theirsLines: readonly string[] = MergeDocument.lines(theirs);
    const parts: string[] = [];
    const conflicts: List<MergeConflict> = new List<MergeConflict>();
    let offset: number = 0;
    for (const region of Merge3.lines(baseLines, oursLines, theirsLines)) {
      const baseText: string = baseLines.slice(region.baseStart, region.baseEnd).join(String.empty);
      const oursText: string = oursLines.slice(region.oursStart, region.oursEnd).join(String.empty);
      const theirsText: string = theirsLines.slice(region.theirsStart, region.theirsEnd).join(String.empty);
      if (region.kind === MergeRegionKind.Conflict)
        conflicts.add(new MergeConflict(conflicts.count(), baseText, oursText, theirsText, offset, offset + baseText.length));
      const text: string = region.kind === MergeRegionKind.Theirs ? theirsText : region.kind === MergeRegionKind.Conflict ? baseText : oursText;
      parts.push(text);
      offset += text.length;
    }

    return new MergeDocument(new MergeStart(parts.join(String.empty), conflicts));
  }

  public static fromMarkers(merged: string): MergeDocument {
    return new MergeDocument(ConflictMarkers.parse(merged));
  }

  public static readMarkers(merged: string): MergeDocument | ConflictMarkersException {
    const start: MergeStart | ConflictMarkersException = ConflictMarkers.read(merged);

    return start instanceof ConflictMarkersException ? start : new MergeDocument(start);
  }

  public get conflicts(): IReadOnlyList<MergeConflict> {
    return this.conflictList;
  }

  public conflictText(index: number): string {
    const conflict: MergeConflict = this.conflictList.get(index);

    return this.document.textBetween(conflict.start, conflict.end);
  }

  public stateOf(index: number): ConflictState {
    return this.conflictList.get(index).stateFor(this.conflictText(index));
  }

  public unresolvedCount(): number {
    return this.conflictList.count(t => this.stateOf(t.index) === ConflictState.Unresolved);
  }

  public conflictAt(offset: number): number | null {
    return this.conflictList.firstOrDefault(t => t.start <= offset && offset <= t.end)?.index ?? null;
  }

  public accept(index: number, choice: ConflictChoice, time: number): TextChange {
    return this.replace(this.conflictList.get(index), this.conflictList.get(index).choiceText(choice), time);
  }

  public acceptAll(choice: ConflictChoice, time: number): TextChange | null {
    const open: IReadOnlyList<MergeConflict> = this.conflictList.where(t => this.stateOf(t.index) === ConflictState.Unresolved).toList();
    if (!open.any())
      return null;
    const edits: IReadOnlyList<TextEdit> = open.select(t => new TextEdit(new TextRange(this.document.positionAt(t.start), this.document.positionAt(t.end)), t.choiceText(choice))).toList();
    const caret: TextPosition = this.document.positionAt(open.get(0).start);

    return this.history.apply(new EditTransaction(edits, EditKind.Other, time, new List([new TextSelection(caret)]), new List([new TextSelection(caret)])));
  }

  public setConflictText(index: number, text: string, time: number): TextChange {
    const conflict: MergeConflict = this.conflictList.get(index);
    conflict.suggest(text);

    return this.replace(conflict, text, time);
  }

  public reset(index: number, time: number): TextChange {
    const conflict: MergeConflict = this.conflictList.get(index);

    return this.replace(conflict, conflict.base, time);
  }

  private replace(conflict: MergeConflict, text: string, time: number): TextChange {
    const range: TextRange = new TextRange(this.document.positionAt(conflict.start), this.document.positionAt(conflict.end));
    const inserted: LineSplit = LineSplit.of(text);
    const count: number = inserted.texts.count();
    const last: string = inserted.texts.get(count - 1);
    const end: TextPosition = count === 1
      ? new TextPosition(range.start.line, range.start.column + last.length)
      : new TextPosition(range.start.line + count - 1, last.length);
    const change: TextChange = this.history.apply(new EditTransaction(new List([new TextEdit(range, text)]), EditKind.Other, time, new List([new TextSelection(range.start)]), new List([new TextSelection(end)])));

    return change;
  }

  private follow(change: TextChange): void {
    for (const conflict of this.conflictList) {
      const isEmpty: boolean = conflict.start === conflict.end;
      conflict.moveTo(MergeDocument.mapStart(conflict.start, isEmpty, change.edits), MergeDocument.mapEnd(conflict.end, isEmpty, change.edits));
    }
  }

  private static mapStart(position: number, isEmpty: boolean, edits: IReadOnlyList<AppliedEdit>): number {
    let delta: number = 0;
    for (const edit of edits) {
      const end: number = edit.oldOffset + edit.oldText.length;
      if (end < position || (end === position && (!String.isNullOrEmpty(edit.oldText) || !isEmpty)))
        delta += edit.text.length - edit.oldText.length;
      else if (edit.oldOffset < position)
        return edit.oldOffset + delta;
      else
        break;
    }

    return position + delta;
  }

  private static mapEnd(position: number, isEmpty: boolean, edits: IReadOnlyList<AppliedEdit>): number {
    let delta: number = 0;
    for (const edit of edits) {
      const end: number = edit.oldOffset + edit.oldText.length;
      if (end < position || (end === position && (!String.isNullOrEmpty(edit.oldText) || isEmpty)))
        delta += edit.text.length - edit.oldText.length;
      else if (edit.oldOffset < position)
        return edit.oldOffset + delta + edit.text.length;
      else
        break;
    }

    return position + delta;
  }

  private static lines(text: string): readonly string[] {
    const split: LineSplit = LineSplit.of(text);
    const lines: string[] = split.texts.select((t, i) => t + split.endings.get(i)).toArray();

    return lines.at(-1) === String.empty ? lines.slice(0, -1) : lines;
  }
}
