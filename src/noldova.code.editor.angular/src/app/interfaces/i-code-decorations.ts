/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { CodeGutterMarker } from "../models/decorations/code-gutter-marker.ts";
import type { CodeInsertedRows } from "../models/rows/code-inserted-rows.ts";
import type { CodeLineDecoration } from "../models/decorations/code-line-decoration.ts";
import type { CodeRangeDecoration } from "../models/decorations/code-range-decoration.ts";
import type { ICodeNumbering } from "./i-code-numbering.ts";

export interface ICodeDecorations {
  readonly rows: IReadOnlyList<CodeInsertedRows>;
  readonly numbering: ICodeNumbering | null;
  linesIn(start: number, end: number): IReadOnlyList<CodeLineDecoration>;
  rangesIn(start: number, end: number): IReadOnlyList<CodeRangeDecoration>;
  markersIn(start: number, end: number): IReadOnlyList<CodeGutterMarker>;
}
