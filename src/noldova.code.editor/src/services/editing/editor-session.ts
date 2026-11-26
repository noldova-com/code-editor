/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type IReadOnlyList, List } from "@noldova/context.collections";

import { EditKind } from "../../enums/edit-kind.js";
import type { EditTransaction } from "../../models/editing/edit-transaction.js";
import { LineSplit } from "../../models/text/line-split.js";
import type { TextDocument } from "../../models/text/text-document.js";
import { TextPosition } from "../../models/text/text-position.js";
import { TextRange } from "../../models/text/text-range.js";
import type { TextEdit } from "../../models/text/text-edit.js";
import { TextSelection } from "../../models/text/text-selection.js";
import { Resources } from "../../resources.js";
import { SelectionMoves } from "../commands/selection-moves.js";
import { TextEditing } from "./text-editing.js";
import type { UndoHistory } from "./undo-history.js";

export class EditorSession {
  public readonly document: TextDocument;
  public readonly history: UndoHistory;
  public readOnly: boolean = false;
  private current: IReadOnlyList<TextSelection> = new List<TextSelection>([new TextSelection(new TextPosition(0, 0))]);
  private goalColumns: IReadOnlyList<number> | null = null;

  public constructor(document: TextDocument, history: UndoHistory) {
    this.document = document;
    this.history = history;
  }

  public get selections(): IReadOnlyList<TextSelection> {
    return this.current;
  }

  public get primary(): TextSelection {
    return this.current.get(this.current.count() - 1);
  }

  public select(selections: IReadOnlyList<TextSelection>): void {
    this.current = SelectionMoves.merge(selections.select(t => this.clamp(t)).toList());
    this.goalColumns = null;
  }

  public placeCaret(position: TextPosition, extend: boolean, add: boolean): void {
    const clamped: TextPosition = this.clampPosition(position);
    this.history.seal();
    this.select(new List<TextSelection>(add ? [...this.current, new TextSelection(clamped)] : [new TextSelection(extend ? this.primary.anchor : clamped, clamped)]));
  }

  public moveLeft(extend: boolean, word: boolean): boolean {
    return this.move(t => SelectionMoves.left(this.document, t, extend, word));
  }

  public moveRight(extend: boolean, word: boolean): boolean {
    return this.move(t => SelectionMoves.right(this.document, t, extend, word));
  }

  public moveLines(lines: number, extend: boolean): boolean {
    const goals: IReadOnlyList<number> = this.goalColumns ?? this.current.select(t => t.head.column).toList();
    this.current = SelectionMoves.merge(this.current.select((t, i) => SelectionMoves.vertical(this.document, t, lines, goals.get(i), extend)).toList());
    this.goalColumns = this.current.count() === goals.count() ? goals : null;

    return true;
  }

  public moveLineStart(extend: boolean): boolean {
    return this.move(t => SelectionMoves.lineStart(this.document, t, extend));
  }

  public moveLineEnd(extend: boolean): boolean {
    return this.move(t => SelectionMoves.lineEnd(this.document, t, extend));
  }

  public moveLineFirstColumn(extend: boolean): boolean {
    return this.move(t => SelectionMoves.lineFirstColumn(t, extend));
  }

  public moveDocumentStart(extend: boolean): boolean {
    return this.move(t => SelectionMoves.documentStart(t, extend));
  }

  public moveDocumentEnd(extend: boolean): boolean {
    return this.move(t => SelectionMoves.documentEnd(this.document, t, extend));
  }

  public selectAll(): boolean {
    this.select(new List<TextSelection>([SelectionMoves.all(this.document)]));

    return true;
  }

  public collapse(): boolean {
    if (this.current.count() === 1 && this.primary.anchor.equals(this.primary.head))
      return false;
    this.select(new List<TextSelection>([new TextSelection(this.primary.head)]));

    return true;
  }

  public deleteBackward(word: boolean, time: number): boolean {
    return this.apply(TextEditing.deleteBackward(this.document, this.current, word, time));
  }

  public deleteForward(word: boolean, time: number): boolean {
    return this.apply(TextEditing.deleteForward(this.document, this.current, word, time));
  }

  public deleteToLineStart(time: number): boolean {
    return this.apply(TextEditing.deleteToLineStart(this.document, this.current, time));
  }

  public deleteToLineEnd(time: number): boolean {
    return this.apply(TextEditing.deleteToLineEnd(this.document, this.current, time));
  }

  public newLine(time: number): boolean {
    return this.apply(TextEditing.newLine(this.document, this.current, time));
  }

  public indent(unit: string, time: number): boolean {
    return this.apply(TextEditing.indent(this.document, this.current, unit, time));
  }

  public outdent(unit: string, time: number): boolean {
    return this.apply(TextEditing.outdent(this.document, this.current, unit, time));
  }

  public undo(): boolean {
    return this.restore(this.readOnly ? null : this.history.undo());
  }

  public redo(): boolean {
    return this.restore(this.readOnly ? null : this.history.redo());
  }

  public type(text: string, time: number): boolean {
    return this.apply(TextEditing.insert(this.current, text, EditKind.Typing, time));
  }

  public paste(text: string, time: number): boolean {
    const lines: LineSplit = LineSplit.of(text);
    const each: boolean = this.current.count() > 1 && lines.texts.count() === this.current.count();

    return this.apply(each ? TextEditing.insertEach(this.current, lines.texts, time) : TextEditing.insert(this.current, text, EditKind.Other, time));
  }

  public replace(edits: IReadOnlyList<TextEdit>, time: number): boolean {
    if (edits.count() === 0)
      return false;

    return this.apply(TextEditing.insertEach(edits.select(t => new TextSelection(t.range.start, t.range.end)).toList(), edits.select(t => t.text).toList(), time));
  }

  public drop(position: TextPosition, text: string, time: number): boolean {
    return this.apply(TextEditing.drop(this.current, this.clampPosition(position), text, time));
  }

  public moveText(range: TextRange, position: TextPosition, time: number): boolean {
    return this.apply(TextEditing.move(this.document, this.current, range, this.clampPosition(position), time));
  }

  public selectedText(): string {
    return this.current
      .where(t => !t.anchor.equals(t.head))
      .select(t => this.document.textIn(new TextRange(SelectionMoves.startOf(t), SelectionMoves.endOf(t))))
      .toArray()
      .join(this.document.lineEnding(0) || Resources.defaultLineBreak);
  }

  public cut(time: number): string {
    const text: string = this.selectedText();
    if (!String.isNullOrEmpty(text) && !this.readOnly)
      this.apply(TextEditing.insert(this.current, String.empty, EditKind.Other, time));

    return text;
  }

  private apply(transaction: EditTransaction | null): boolean {
    if (this.readOnly)
      return false;
    if (!Object.isNull(transaction)) {
      this.history.apply(transaction);
      this.select(transaction.selectionsAfter);
    }

    return true;
  }

  private move(to: (selection: TextSelection) => TextSelection): boolean {
    this.select(this.current.select(to).toList());

    return true;
  }

  private restore(selections: IReadOnlyList<TextSelection> | null): boolean {
    if (!Object.isNull(selections))
      this.select(selections);

    return true;
  }

  private clamp(selection: TextSelection): TextSelection {
    return new TextSelection(this.clampPosition(selection.anchor), this.clampPosition(selection.head));
  }

  private clampPosition(position: TextPosition): TextPosition {
    const line: number = Math.min(position.line, this.document.lineCount - 1);

    return SelectionMoves.columnIn(this.document, line, position.column);
  }
}
