/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { ICodeDecorations } from "../../interfaces/i-code-decorations.ts";
import type { CodeGutterMarker } from "../decorations/code-gutter-marker.ts";
import type { CodeLineDecoration } from "../decorations/code-line-decoration.ts";
import type { CodeRangeDecoration } from "../decorations/code-range-decoration.ts";

export class LayerLines {
  public readonly lines: IReadOnlyList<CodeLineDecoration>;
  public readonly ranges: IReadOnlyList<CodeRangeDecoration>;
  public readonly markers: IReadOnlyList<CodeGutterMarker>;

  public constructor(decorations: ICodeDecorations, start: number, end: number) {
    this.lines = decorations.linesIn(start, end);
    this.ranges = decorations.rangesIn(start, end);
    this.markers = decorations.markersIn(start, end);
  }
}
