/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextPosition, TextRange } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";
import { describe, expect, it } from "vitest";

import { CodeDecorations } from "../../../../src/app/models/decorations/code-decorations.ts";
import { CodeGutterMarker } from "../../../../src/app/models/decorations/code-gutter-marker.ts";
import { CodeLineDecoration } from "../../../../src/app/models/decorations/code-line-decoration.ts";
import { CodeRangeDecoration } from "../../../../src/app/models/decorations/code-range-decoration.ts";
import { LineIndex } from "../../../../src/app/models/rows/line-index.ts";
import { Span } from "../../../fixtures/span.fixture.ts";

describe("LineIndex", () => {
  it("finds the items that overlap a line range, a long early item and items that start together included, in the order they were given", () => {
    const index: LineIndex<Span> = new LineIndex<Span>(new List<Span>([
      new Span("late", 50, 51),
      new Span("long", 0, 100),
      new Span("short", 10, 12),
      new Span("empty", 20, 20),
      new Span("next", 12, 13),
      new Span("twin", 10, 11)
    ]), t => t.start, t => t.end);

    expect(Span.namesIn(index, 10, 12)).toEqual(["long", "short", "twin"]);
    expect(Span.namesIn(index, 11, 12)).toEqual(["long", "short"]);
    expect(Span.namesIn(index, 12, 13)).toEqual(["long", "next"]);
    expect(Span.namesIn(index, 50, 60)).toEqual(["late", "long"]);
    expect(Span.namesIn(index, 100, 200)).toEqual([]);
    expect(Span.namesIn(index, 20, 21)).toEqual(["long"]);
  });

  it("finds nothing in an empty index, or in a range that starts where every item ends", () => {
    expect(Span.namesIn(new LineIndex<Span>(new List<Span>(), t => t.start, t => t.end), 0, 10)).toEqual([]);
    expect(Span.namesIn(new LineIndex<Span>(new List<Span>([new Span("one", 0, 5)]), t => t.start, t => t.end), 5, 7)).toEqual([]);
  });
});

describe("CodeDecorations", () => {
  it("answers the line decorations, ranges and markers that reach a line range", () => {
    const line: CodeLineDecoration = new CodeLineDecoration(2, 3, "red");
    const range: CodeRangeDecoration = new CodeRangeDecoration(new TextRange(new TextPosition(1, 4), new TextPosition(6, 0)), "blue");
    const marker: CodeGutterMarker = new CodeGutterMarker(5, "!", "green");
    const decorations: CodeDecorations = new CodeDecorations(new List<CodeLineDecoration>([line]), new List<CodeRangeDecoration>([range]), new List<CodeGutterMarker>([marker]));

    expect([decorations.linesIn(4, 5).toArray(), decorations.rangesIn(6, 7).toArray(), decorations.markersIn(5, 6).toArray()]).toEqual([[line], [range], [marker]]);
    expect([decorations.linesIn(5, 9).toArray(), decorations.rangesIn(7, 9).toArray(), decorations.markersIn(0, 5).toArray()]).toEqual([[], [], []]);
    expect([decorations.rows.toArray(), decorations.numbering]).toEqual([[], null]);
  });
});
