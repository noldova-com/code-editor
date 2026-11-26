/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";

import { EditKind } from "../../enums/edit-kind.js";
import { EditTransaction } from "../../models/editing/edit-transaction.js";
import type { TextDocument } from "../../models/text/text-document.js";
import { TextEdit } from "../../models/text/text-edit.js";
import { TextPosition } from "../../models/text/text-position.js";
import { TextRange } from "../../models/text/text-range.js";
import { TextSelection } from "../../models/text/text-selection.js";
import { Resources } from "../../resources.js";
import { PositionMapper } from "./position-mapper.js";
import { SelectionMoves } from "../commands/selection-moves.js";

export class TextEditing {
  public static insert(selections: IReadOnlyList<TextSelection>, text: string, kind: EditKind, time: number): EditTransaction {
    const merged: IReadOnlyList<TextSelection> = SelectionMoves.merge(selections);

    return TextEditing.transaction(merged.select(t => new TextEdit(TextEditing.rangeOf(t), text)).toList(), kind, time, selections, true);
  }

  public static insertEach(selections: IReadOnlyList<TextSelection>, texts: IReadOnlyList<string>, time: number): EditTransaction {
    const edits: IReadOnlyList<TextEdit> = selections.select((t, i) => new TextEdit(TextEditing.rangeOf(t), texts.get(i))).toList();

    return TextEditing.transaction(edits, EditKind.Other, time, selections, true);
  }

  public static newLine(document: TextDocument, selections: IReadOnlyList<TextSelection>, time: number): EditTransaction {
    const lineBreak: string = document.lineCount > 1 ? document.lineEnding(0) : Resources.defaultLineBreak;
    const merged: IReadOnlyList<TextSelection> = SelectionMoves.merge(selections);
    const edits: IReadOnlyList<TextEdit> = merged.select(t => {
      const start: TextPosition = SelectionMoves.startOf(t);
      const text: string = document.lineText(start.line);
      const indent: string = text.slice(0, Math.min(start.column, text.length - text.trimStart().length));

      return new TextEdit(TextEditing.rangeOf(t), lineBreak + indent);
    }).toList();

    return TextEditing.transaction(edits, EditKind.Typing, time, selections, true);
  }

  public static deleteBackward(document: TextDocument, selections: IReadOnlyList<TextSelection>, word: boolean, time: number): EditTransaction | null {
    return TextEditing.delete(selections, t => t.anchor.equals(t.head) ? SelectionMoves.left(document, t, true, word) : t, time);
  }

  public static deleteForward(document: TextDocument, selections: IReadOnlyList<TextSelection>, word: boolean, time: number): EditTransaction | null {
    return TextEditing.delete(selections, t => t.anchor.equals(t.head) ? SelectionMoves.right(document, t, true, word) : t, time);
  }

  public static deleteToLineStart(document: TextDocument, selections: IReadOnlyList<TextSelection>, time: number): EditTransaction | null {
    return TextEditing.delete(selections, t => TextEditing.toLineStart(document, t), time);
  }

  public static deleteToLineEnd(document: TextDocument, selections: IReadOnlyList<TextSelection>, time: number): EditTransaction | null {
    return TextEditing.delete(selections, t => TextEditing.toLineEnd(document, t), time);
  }

  public static indent(document: TextDocument, selections: IReadOnlyList<TextSelection>, unit: string, time: number): EditTransaction {
    if (selections.all(t => t.anchor.line === t.head.line))
      return TextEditing.insert(selections, unit, EditKind.Typing, time);
    const edits: IReadOnlyList<TextEdit> = TextEditing.linesOf(selections)
      .where(t => !String.isNullOrEmpty(document.lineText(t)))
      .select(t => new TextEdit(TextRange.of(t, 0, t, 0), unit))
      .toList();

    return TextEditing.transaction(edits, EditKind.Other, time, selections, false);
  }

  public static outdent(document: TextDocument, selections: IReadOnlyList<TextSelection>, unit: string, time: number): EditTransaction | null {
    const edits: IReadOnlyList<TextEdit> = TextEditing.linesOf(selections).selectMany(t => {
      const text: string = document.lineText(t);
      const width: number = text.startsWith(Resources.tab) ? 1 : Math.min(unit.length, text.length - text.trimStart().length);

      return width === 0 ? [] : [new TextEdit(TextRange.of(t, 0, t, width), String.empty)];
    }).toList();

    return edits.count() === 0 ? null : TextEditing.transaction(edits, EditKind.Other, time, selections, false);
  }

  public static drop(selections: IReadOnlyList<TextSelection>, position: TextPosition, text: string, time: number): EditTransaction {
    const edits: IReadOnlyList<TextEdit> = new List<TextEdit>([new TextEdit(new TextRange(position, position), text)]);

    return new EditTransaction(edits, EditKind.Other, time, selections, new List<TextSelection>([new TextSelection(position, new PositionMapper(edits).map(position))]));
  }

  public static move(document: TextDocument, selections: IReadOnlyList<TextSelection>, range: TextRange, position: TextPosition,
    time: number): EditTransaction | null {
    if (position.compareTo(range.start) >= 0 && position.compareTo(range.end) <= 0)
      return null;
    const removal: TextEdit = new TextEdit(range, String.empty);
    const insertion: TextEdit = new TextEdit(new TextRange(position, position), document.textIn(range));
    const start: TextPosition = new PositionMapper(new List<TextEdit>([removal])).map(position);
    const edits: IReadOnlyList<TextEdit> = new List<TextEdit>([removal, insertion]);

    return new EditTransaction(edits, EditKind.Other, time, selections,
      new List<TextSelection>([new TextSelection(start, new PositionMapper(edits).map(position))]));
  }

  private static delete(selections: IReadOnlyList<TextSelection>, expand: (selection: TextSelection) => TextSelection, time: number): EditTransaction | null {
    const ranges: IReadOnlyList<TextSelection> = SelectionMoves.merge(selections.select(expand).toList()).where(t => !t.anchor.equals(t.head)).toList();
    if (ranges.count() === 0)
      return null;

    return TextEditing.transaction(ranges.select(t => new TextEdit(TextEditing.rangeOf(t), String.empty)).toList(), EditKind.Deleting, time, selections, true);
  }

  private static toLineStart(document: TextDocument, selection: TextSelection): TextSelection {
    if (!selection.anchor.equals(selection.head))
      return selection;

    return selection.head.column === 0 ? SelectionMoves.left(document, selection, true, false) : SelectionMoves.lineFirstColumn(selection, true);
  }

  private static toLineEnd(document: TextDocument, selection: TextSelection): TextSelection {
    if (!selection.anchor.equals(selection.head))
      return selection;
    const end: number = document.lineText(selection.head.line).length;

    return selection.head.column === end ? SelectionMoves.right(document, selection, true, false) : SelectionMoves.lineEnd(document, selection, true);
  }

  private static transaction(edits: IReadOnlyList<TextEdit>, kind: EditKind, time: number, before: IReadOnlyList<TextSelection>, collapse: boolean): EditTransaction {
    const mapper: PositionMapper = new PositionMapper(edits);
    const after: IReadOnlyList<TextSelection> = SelectionMoves.merge(before.select(t => collapse
      ? new TextSelection(mapper.map(SelectionMoves.endOf(t)))
      : new TextSelection(mapper.map(t.anchor), mapper.map(t.head))).toList());

    return new EditTransaction(edits, kind, time, before, after);
  }

  private static linesOf(selections: IReadOnlyList<TextSelection>): List<number> {
    const lines: Set<number> = new Set();
    for (const selection of selections) {
      const start: TextPosition = SelectionMoves.startOf(selection);
      const end: TextPosition = SelectionMoves.endOf(selection);
      const last: number = end.column === 0 && end.line > start.line ? end.line - 1 : end.line;
      for (let line: number = start.line; line <= last; line++)
        lines.add(line);
    }

    return Enumerable.from(lines).orderBy(t => t).toList();
  }

  private static rangeOf(selection: TextSelection): TextRange {
    return new TextRange(SelectionMoves.startOf(selection), SelectionMoves.endOf(selection));
  }
}
