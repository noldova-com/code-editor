/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextDocument } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";
import { describe, expect, it } from "vitest";

import type { ICodeDecorations } from "../../../../src/app/interfaces/i-code-decorations.ts";
import { CodeBlocks } from "../../../../src/app/models/folding/code-blocks.ts";
import { CodeDecorations } from "../../../../src/app/models/decorations/code-decorations.ts";
import type { CodeGutterMarker } from "../../../../src/app/models/decorations/code-gutter-marker.ts";
import type { CodeLineDecoration } from "../../../../src/app/models/decorations/code-line-decoration.ts";
import type { CodeRangeDecoration } from "../../../../src/app/models/decorations/code-range-decoration.ts";
import { CodeEmbeddedLines } from "../../../../src/app/models/rows/code-embedded-lines.ts";
import type { CodeInsertedRows } from "../../../../src/app/models/rows/code-inserted-rows.ts";
import { CodeFold } from "../../../../src/app/models/folding/code-fold.ts";
import { CodeSpacer } from "../../../../src/app/models/rows/code-spacer.ts";
import { RowLayout } from "../../../../src/app/models/rows/row-layout.ts";

describe("CodeBlocks", () => {
  it("keeps a collapsed fold inside or overlapping an earlier collapsed fold out, so the rows stay in order and count every line", () => {
    const outer: CodeFold = new CodeFold(0, 10, true);
    const blocks: CodeBlocks = new CodeBlocks(20, new List<ICodeDecorations>(), new List<CodeFold>([new CodeFold(2, 3, true), outer, new CodeFold(8, 5, true), new CodeFold(12, 2, true)]));
    const layout: RowLayout = new RowLayout(20, blocks.blocks);

    expect(blocks.blocks.map(t => [t.line, t.hidden])).toEqual([[0, 10], [12, 2]]);
    expect(layout.rowCount).toBe(10);
    expect(layout.rowAt(0).block?.fold).toBe(outer);
    expect([layout.rowAt(1).line, layout.rowAt(2).line, layout.rowAt(3).block?.line, layout.rowAt(4).line]).toEqual([10, 11, 12, 14]);
  });

  it("clamps a collapsed fold that reaches past the last line, and leaves out folds and rows that start past it", () => {
    const blocks: CodeBlocks = new CodeBlocks(20, new List<ICodeDecorations>([new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([new CodeSpacer(25, 2), new CodeSpacer(20, 1)]))]),
      new List<CodeFold>([new CodeFold(15, 10, true), new CodeFold(20, 3, true), new CodeFold(30, 1, true), new CodeFold(3, 0, true)]));

    expect(blocks.blocks.map(t => [t.line, t.length, t.hidden])).toEqual([[15, 1, 5], [20, 1, 0]]);
    expect(new RowLayout(20, blocks.blocks).rowCount).toBe(17);
  });

  it("numbers up to the largest of the document's lines, the layers' numbering and the embedded documents' lines", () => {
    const other: TextDocument = TextDocument.fromText(Array.from({ length: 120 }, () => "x").join("\n"));

    expect(new CodeBlocks(20, new List<ICodeDecorations>(), new List<CodeFold>()).largestNumber).toBe(20);
    expect(new CodeBlocks(20, new List<ICodeDecorations>([new CodeDecorations(new List<CodeLineDecoration>(), new List<CodeRangeDecoration>(), new List<CodeGutterMarker>(), new List<CodeInsertedRows>([new CodeSpacer(1, 1), new CodeEmbeddedLines(2, other, 0, 1)]))]), new List<CodeFold>()).largestNumber).toBe(120);
  });
});
