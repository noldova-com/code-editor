/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { ICodeDecorations } from "../../interfaces/i-code-decorations.ts";
import type { ICodeNumbering } from "../../interfaces/i-code-numbering.ts";
import type { CodeGutterMarker } from "./code-gutter-marker.ts";
import type { CodeInsertedRows } from "../rows/code-inserted-rows.ts";
import type { CodeLineDecoration } from "./code-line-decoration.ts";
import type { CodeRangeDecoration } from "./code-range-decoration.ts";
import { LineIndex } from "../rows/line-index.ts";

export class CodeDecorations implements ICodeDecorations {
  private static readonly NO_LINES: IReadOnlyList<CodeLineDecoration> = new List<CodeLineDecoration>();
  private static readonly NO_RANGES: IReadOnlyList<CodeRangeDecoration> = new List<CodeRangeDecoration>();
  private static readonly NO_MARKERS: IReadOnlyList<CodeGutterMarker> = new List<CodeGutterMarker>();
  private static readonly NO_ROWS: IReadOnlyList<CodeInsertedRows> = new List<CodeInsertedRows>();
  public readonly lines: IReadOnlyList<CodeLineDecoration>;
  public readonly ranges: IReadOnlyList<CodeRangeDecoration>;
  public readonly markers: IReadOnlyList<CodeGutterMarker>;
  public readonly rows: IReadOnlyList<CodeInsertedRows>;
  public readonly numbering: ICodeNumbering | null;
  private readonly lineIndex: LineIndex<CodeLineDecoration>;
  private readonly rangeIndex: LineIndex<CodeRangeDecoration>;
  private readonly markerIndex: LineIndex<CodeGutterMarker>;

  public constructor(lines: IReadOnlyList<CodeLineDecoration> = CodeDecorations.NO_LINES, ranges: IReadOnlyList<CodeRangeDecoration> = CodeDecorations.NO_RANGES,
    markers: IReadOnlyList<CodeGutterMarker> = CodeDecorations.NO_MARKERS, rows: IReadOnlyList<CodeInsertedRows> = CodeDecorations.NO_ROWS, numbering: ICodeNumbering | null = null) {
    this.lines = lines;
    this.ranges = ranges;
    this.markers = markers;
    this.rows = rows;
    this.numbering = numbering;
    this.lineIndex = new LineIndex<CodeLineDecoration>(lines, t => t.startLine, t => t.startLine + t.lineCount);
    this.rangeIndex = new LineIndex<CodeRangeDecoration>(ranges, t => t.range.start.line, t => t.range.end.line + 1);
    this.markerIndex = new LineIndex<CodeGutterMarker>(markers, t => t.line, t => t.line + 1);
  }

  public linesIn(start: number, end: number): IReadOnlyList<CodeLineDecoration> {
    return this.lineIndex.overlapping(start, end);
  }

  public rangesIn(start: number, end: number): IReadOnlyList<CodeRangeDecoration> {
    return this.rangeIndex.overlapping(start, end);
  }

  public markersIn(start: number, end: number): IReadOnlyList<CodeGutterMarker> {
    return this.markerIndex.overlapping(start, end);
  }
}
