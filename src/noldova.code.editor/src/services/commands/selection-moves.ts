/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type Enumerable, type IReadOnlyList, List } from "@noldova/context.collections";

import type { TextDocument } from "../../models/text/text-document.js";
import { TextPosition } from "../../models/text/text-position.js";
import { TextSelection } from "../../models/text/text-selection.js";
import { Resources } from "../../resources.js";

export class SelectionMoves {
  public static startOf(selection: TextSelection): TextPosition {
    return selection.anchor.compareTo(selection.head) <= 0 ? selection.anchor : selection.head;
  }

  public static endOf(selection: TextSelection): TextPosition {
    return selection.anchor.compareTo(selection.head) <= 0 ? selection.head : selection.anchor;
  }

  public static left(document: TextDocument, selection: TextSelection, extend: boolean, word: boolean): TextSelection {
    if (!extend && !word && !selection.anchor.equals(selection.head))
      return new TextSelection(SelectionMoves.startOf(selection));

    return SelectionMoves.to(selection, SelectionMoves.before(document, selection.head, word), extend);
  }

  public static right(document: TextDocument, selection: TextSelection, extend: boolean, word: boolean): TextSelection {
    if (!extend && !word && !selection.anchor.equals(selection.head))
      return new TextSelection(SelectionMoves.endOf(selection));

    return SelectionMoves.to(selection, SelectionMoves.after(document, selection.head, word), extend);
  }

  public static vertical(document: TextDocument, selection: TextSelection, lines: number, goalColumn: number, extend: boolean): TextSelection {
    const line: number = Math.min(document.lineCount - 1, Math.max(0, selection.head.line + lines));
    if (line === selection.head.line && lines !== 0)
      return SelectionMoves.to(selection, lines < 0 ? new TextPosition(0, 0) : new TextPosition(line, document.lineText(line).length), extend);

    return SelectionMoves.to(selection, SelectionMoves.columnIn(document, line, goalColumn), extend);
  }

  public static lineStart(document: TextDocument, selection: TextSelection, extend: boolean): TextSelection {
    const text: string = document.lineText(selection.head.line);
    const indent: number = text.length - text.trimStart().length;
    const column: number = selection.head.column === indent ? 0 : indent;

    return SelectionMoves.to(selection, new TextPosition(selection.head.line, column), extend);
  }

  public static lineEnd(document: TextDocument, selection: TextSelection, extend: boolean): TextSelection {
    return SelectionMoves.to(selection, new TextPosition(selection.head.line, document.lineText(selection.head.line).length), extend);
  }

  public static lineFirstColumn(selection: TextSelection, extend: boolean): TextSelection {
    return SelectionMoves.to(selection, new TextPosition(selection.head.line, 0), extend);
  }

  public static documentStart(selection: TextSelection, extend: boolean): TextSelection {
    return SelectionMoves.to(selection, new TextPosition(0, 0), extend);
  }

  public static documentEnd(document: TextDocument, selection: TextSelection, extend: boolean): TextSelection {
    const line: number = document.lineCount - 1;

    return SelectionMoves.to(selection, new TextPosition(line, document.lineText(line).length), extend);
  }

  public static all(document: TextDocument): TextSelection {
    const line: number = document.lineCount - 1;

    return new TextSelection(new TextPosition(0, 0), new TextPosition(line, document.lineText(line).length));
  }

  public static columnIn(document: TextDocument, line: number, column: number): TextPosition {
    const text: string = document.lineText(line);
    const clamped: number = Math.min(column, text.length);

    return new TextPosition(line, SelectionMoves.splitsPair(text, clamped) ? clamped - 1 : clamped);
  }

  public static merge(selections: IReadOnlyList<TextSelection>): IReadOnlyList<TextSelection> {
    const sorted: Enumerable<TextSelection> = selections.orderBy(t => SelectionMoves.startOf(t), (a, b) => a.compareTo(b));
    const merged: List<TextSelection> = new List<TextSelection>();
    for (const selection of sorted) {
      const last: TextSelection | undefined = merged.tryGet(merged.count() - 1);
      if (!Object.isUndefined(last) && SelectionMoves.overlaps(last, selection))
        merged.set(merged.count() - 1, SelectionMoves.join(last, selection));
      else
        merged.add(selection);
    }

    return merged;
  }

  private static overlaps(first: TextSelection, second: TextSelection): boolean {
    const end: TextPosition = SelectionMoves.endOf(first);
    const start: TextPosition = SelectionMoves.startOf(second);

    return start.compareTo(end) < 0 || start.equals(end) && (first.anchor.equals(first.head) || second.anchor.equals(second.head));
  }

  private static join(first: TextSelection, second: TextSelection): TextSelection {
    const start: TextPosition = SelectionMoves.startOf(first);
    const end: TextPosition = SelectionMoves.endOf(first).compareTo(SelectionMoves.endOf(second)) >= 0 ? SelectionMoves.endOf(first) : SelectionMoves.endOf(second);

    return first.anchor.compareTo(first.head) <= 0 ? new TextSelection(start, end) : new TextSelection(end, start);
  }

  private static to(selection: TextSelection, head: TextPosition, extend: boolean): TextSelection {
    return extend ? new TextSelection(selection.anchor, head) : new TextSelection(head);
  }

  private static before(document: TextDocument, position: TextPosition, word: boolean): TextPosition {
    if (position.column === 0)
      return position.line === 0 ? position : new TextPosition(position.line - 1, document.lineText(position.line - 1).length);
    const text: string = document.lineText(position.line);
    if (!word)
      return new TextPosition(position.line, position.column - (SelectionMoves.splitsPair(text, position.column - 1) ? Resources.surrogatePairLength : 1));
    let column: number = position.column;
    while (column > 0 && Resources.spacePattern.test(text.charAt(column - 1)))
      column--;
    const kind: number = SelectionMoves.kindOf(text.charAt(column - 1));
    while (column > 0 && SelectionMoves.kindOf(text.charAt(column - 1)) === kind)
      column--;

    return new TextPosition(position.line, column);
  }

  private static after(document: TextDocument, position: TextPosition, word: boolean): TextPosition {
    const text: string = document.lineText(position.line);
    if (position.column === text.length)
      return position.line === document.lineCount - 1 ? position : new TextPosition(position.line + 1, 0);
    if (!word)
      return new TextPosition(position.line, position.column + (SelectionMoves.splitsPair(text, position.column + 1) ? Resources.surrogatePairLength : 1));
    let column: number = position.column;
    while (column < text.length && Resources.spacePattern.test(text.charAt(column)))
      column++;
    const kind: number = SelectionMoves.kindOf(text.charAt(column));
    while (column < text.length && SelectionMoves.kindOf(text.charAt(column)) === kind)
      column++;

    return new TextPosition(position.line, column);
  }

  private static kindOf(character: string): number {
    return Resources.spacePattern.test(character) ? Resources.spaceCharacterKind : Resources.wordCharacterPattern.test(character) ? Resources.wordCharacterKind : Resources.otherCharacterKind;
  }

  private static splitsPair(text: string, column: number): boolean {
    const before: number = text.charCodeAt(column - 1);
    const after: number = text.charCodeAt(column);

    return before >= Resources.highSurrogateFirst && before <= Resources.highSurrogateLast && after >= Resources.lowSurrogateFirst && after <= Resources.lowSurrogateLast;
  }
}
