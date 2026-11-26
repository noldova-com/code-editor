/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { LineSegment } from "@noldova/code.editor";
import type { IReadOnlyList } from "@noldova/context.collections";

import type { CodeRowKind } from "../../enums/code-row-kind.ts";
import type { CodeBar } from "../decorations/code-bar.ts";
import type { CodeFold } from "../folding/code-fold.ts";
import type { CodeGutterMarker } from "../decorations/code-gutter-marker.ts";
import type { RowSpan } from "./row-span.ts";

export class CodeRow {
  public readonly number: number | null;
  public readonly otherNumber: number | null;
  public readonly text: string;
  public readonly segments: IReadOnlyList<LineSegment>;
  public readonly kind: CodeRowKind;
  public readonly paints: readonly string[];
  public readonly marker: CodeGutterMarker | null;
  public readonly spans: readonly RowSpan[];
  public readonly bar: CodeBar | null;
  public readonly fold: CodeFold | null;

  public constructor(number: number | null, otherNumber: number | null, text: string, segments: IReadOnlyList<LineSegment>, kind: CodeRowKind,
    paints: readonly string[], marker: CodeGutterMarker | null, spans: readonly RowSpan[], bar: CodeBar | null, fold: CodeFold | null) {
    this.number = number;
    this.otherNumber = otherNumber;
    this.text = text;
    this.segments = segments;
    this.kind = kind;
    this.paints = paints;
    this.marker = marker;
    this.spans = spans;
    this.bar = bar;
    this.fold = fold;
  }
}
