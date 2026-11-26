/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TextRange } from "@noldova/code.editor";
import { CodeGutterMarker, type CodeInsertedRows, CodeLineDecoration, CodeRangeDecoration, CodeSpacer, type ICodeDecorations, type ICodeNumbering,
  LineIndex } from "@noldova/code.editor.angular";
import { DiffSide, type DocumentDiff, type LineChange } from "@noldova/code.editor.diff";
import { Enumerable, type IReadOnlyList } from "@noldova/context.collections";

import { Resources } from "../../resources.ts";

export class DiffLayer implements ICodeDecorations {
  public readonly rows: IReadOnlyList<CodeInsertedRows>;
  public readonly numbering: ICodeNumbering | null;
  private readonly diff: DocumentDiff;
  private readonly side: DiffSide;
  private readonly index: LineIndex<LineChange>;
  private readonly background: string;
  private readonly change: string;
  private readonly sign: string;
  private readonly color: string;

  public constructor(diff: DocumentDiff, side: DiffSide, rows: IReadOnlyList<CodeInsertedRows> = DiffLayer.spacersOf(diff, side),
    numbering: ICodeNumbering | null = null) {
    const original: boolean = side === DiffSide.Original;
    this.diff = diff;
    this.side = side;
    this.rows = rows;
    this.numbering = numbering;
    this.index = new LineIndex<LineChange>(diff.changes, t => t.startOf(side), t => t.endOf(side));
    this.background = original ? Resources.removedBackground : Resources.addedBackground;
    this.change = original ? Resources.removedChange : Resources.addedChange;
    this.sign = original ? Resources.removedSign : Resources.addedSign;
    this.color = original ? Resources.removedColor : Resources.addedColor;
  }

  public linesIn(start: number, end: number): IReadOnlyList<CodeLineDecoration> {
    return this.index.overlapping(start, end)
      .select(t => new CodeLineDecoration(t.startOf(this.side), t.endOf(this.side) - t.startOf(this.side), this.background))
      .toList();
  }

  public rangesIn(start: number, end: number): IReadOnlyList<CodeRangeDecoration> {
    return this.index.overlapping(start, end)
      .selectMany((t): IReadOnlyList<TextRange> => this.side === DiffSide.Original ? this.diff.rangesOf(t).original : this.diff.rangesOf(t).modified)
      .where(t => t.start.line < end && t.end.line >= start)
      .select(t => new CodeRangeDecoration(t, this.change))
      .toList();
  }

  public markersIn(start: number, end: number): IReadOnlyList<CodeGutterMarker> {
    return this.index.overlapping(start, end)
      .selectMany(t => {
        const first: number = Math.max(start, t.startOf(this.side));

        return Enumerable.range(first, Math.min(end, t.endOf(this.side)) - first);
      })
      .select(t => new CodeGutterMarker(t, this.sign, this.color))
      .toList();
  }

  private static spacersOf(diff: DocumentDiff, side: DiffSide): IReadOnlyList<CodeInsertedRows> {
    const other: DiffSide = side === DiffSide.Original ? DiffSide.Modified : DiffSide.Original;

    return diff.changes
      .where(t => t.endOf(other) - t.startOf(other) > t.endOf(side) - t.startOf(side))
      .select((t): CodeInsertedRows => new CodeSpacer(t.endOf(side), t.endOf(other) - t.startOf(other) - (t.endOf(side) - t.startOf(side))))
      .toList();
  }
}
