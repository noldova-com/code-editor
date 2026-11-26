/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type LineSegment, type LineToken, Required, type TextDocument, type TokenCache, TokenSegments } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Resources } from "../../../resources.ts";
import { CodeRowKind } from "../../enums/code-row-kind.ts";
import type { ICodeDecorations } from "../../interfaces/i-code-decorations.ts";
import type { ICodeNumbering } from "../../interfaces/i-code-numbering.ts";
import type { CodeBar } from "../decorations/code-bar.ts";
import type { CodeBlock } from "../folding/code-block.ts";
import type { CodeEmbeddedLines } from "./code-embedded-lines.ts";
import type { CodeFold } from "../folding/code-fold.ts";
import { CodeGutterMarker } from "../decorations/code-gutter-marker.ts";
import type { CodeInsertedRows } from "./code-inserted-rows.ts";
import { CodeRow } from "./code-row.ts";
import type { CodeSpacer } from "./code-spacer.ts";
import { LayerLines } from "./layer-lines.ts";
import type { LayoutRow } from "./layout-row.ts";
import { RowSpan } from "./row-span.ts";

export class RowBuilder {
  private static readonly NO_TOKENS: IReadOnlyList<LineToken> = new List<LineToken>();
  private static readonly NO_SEGMENTS: IReadOnlyList<LineSegment> = new List<LineSegment>();
  private readonly document: TextDocument;
  private readonly cache: TokenCache | null;
  private readonly layers: IReadOnlyList<ICodeDecorations>;
  private readonly openFolds: ReadonlyMap<number, CodeFold>;
  private readonly numbering: ICodeNumbering | null;

  public constructor(document: TextDocument, cache: TokenCache | null, layers: IReadOnlyList<ICodeDecorations>, openFolds: ReadonlyMap<number, CodeFold>) {
    this.document = document;
    this.cache = cache;
    this.layers = layers;
    this.openFolds = openFolds;
    this.numbering = layers.lastOrDefault(t => !Object.isNull(t.numbering))?.numbering ?? null;
  }

  public rowsOf(items: readonly LayoutRow[]): readonly CodeRow[] {
    const lines: readonly number[] = items.filter(t => Object.isNull(t.block)).map(t => t.line);
    const start: number = Math.min(...lines);
    const end: number = Math.max(...lines) + 1;
    const found: readonly LayerLines[] = Array.from(this.layers, t => new LayerLines(t, start, end));

    return items.map(t => Object.isNull(t.block) ? this.lineRow(t.line, found) : this.blockRow(t.block, t.index));
  }

  private lineRow(line: number, found: readonly LayerLines[]): CodeRow {
    const text: string = this.document.lineText(line);
    const segments: IReadOnlyList<LineSegment> = RowBuilder.segmentsOf(text, this.cache, line);

    return RowBuilder.painted(line + 1, this.numbering?.numberOf(line) ?? null, text, segments, CodeRowKind.Line, line, found,
      this.openFolds.get(line) ?? null);
  }

  private blockRow(block: CodeBlock, index: number): CodeRow {
    const rows: CodeInsertedRows | null = block.rows;
    if (!Object.isNull(rows))
      return rows.rowAt(this, block.line, index);
    const fold: CodeFold = Required.value(block.fold);
    const label: string = fold.label ?? Resources.formatHidden(block.hidden);

    return new CodeRow(null, null, label, TokenSegments.fill(label.length, RowBuilder.NO_TOKENS), CodeRowKind.Fold, [], null, [], null, fold);
  }

  public barRow(bar: CodeBar): CodeRow {
    return new CodeRow(null, null, Resources.empty, RowBuilder.NO_SEGMENTS, CodeRowKind.Bar, [], null, [], bar, null);
  }

  public spacerRow(spacer: CodeSpacer, line: number): CodeRow {
    const marker: CodeGutterMarker | null = Object.isNull(spacer.sign) ? null : new CodeGutterMarker(line, spacer.sign, spacer.signColor ?? Resources.inherit);

    return Object.isNull(spacer.background)
      ? new CodeRow(null, null, Resources.empty, RowBuilder.NO_SEGMENTS, CodeRowKind.Spacer, [], marker, [], null, null)
      : new CodeRow(null, null, Resources.empty, RowBuilder.NO_SEGMENTS, CodeRowKind.Line, [spacer.background], marker, [], null, null);
  }

  public embeddedRow(rows: CodeEmbeddedLines, line: number): CodeRow {
    const text: string = rows.document.lineText(line);
    const found: readonly LayerLines[] = Object.isNull(rows.decorations) ? [] : [new LayerLines(rows.decorations, line, line + 1)];
    const paired: boolean = !Object.isNull(this.numbering);

    return RowBuilder.painted(paired ? null : line + 1, paired ? line + 1 : null, text, RowBuilder.segmentsOf(text, rows.tokens, line), CodeRowKind.Embedded,
      line, found, null);
  }

  private static painted(number: number | null, otherNumber: number | null, text: string, segments: IReadOnlyList<LineSegment>, kind: CodeRowKind, line: number,
    found: readonly LayerLines[], fold: CodeFold | null): CodeRow {
    const paints: string[] = [];
    const spans: RowSpan[] = [];
    let marker: CodeGutterMarker | null = null;
    for (const layer of found) {
      for (const decoration of layer.lines.where(t => line >= t.startLine && line < t.startLine + t.lineCount))
        paints.push(decoration.background);
      for (const decoration of layer.ranges.where(t => t.range.start.line <= line && t.range.end.line >= line)) {
        const start: number = decoration.range.start.line === line ? decoration.range.start.column : 0;
        const end: number = decoration.range.end.line === line ? decoration.range.end.column : text.length;
        if (end > start)
          spans.push(new RowSpan(start, end, decoration.background));
      }
      marker = layer.markers.lastOrDefault(t => t.line === line) ?? marker;
    }

    return new CodeRow(number, otherNumber, text, segments, kind, paints, marker, spans, null, fold);
  }

  private static segmentsOf(text: string, cache: TokenCache | null, line: number): IReadOnlyList<LineSegment> {
    return TokenSegments.fill(text.length, Object.isNull(cache) ? RowBuilder.NO_TOKENS : cache.tokensOf(line).tokens);
  }
}
