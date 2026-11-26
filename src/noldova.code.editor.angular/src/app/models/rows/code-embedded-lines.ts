/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { type TextDocument, TextPosition, type TokenCache } from "@noldova/code.editor";

import { Resources } from "../../../resources.ts";
import type { ICodeDecorations } from "../../interfaces/i-code-decorations.ts";
import type { CodeRow } from "./code-row.ts";
import { InsertedRows } from "./inserted-rows.ts";
import type { RowBuilder } from "./row-builder.ts";

export class CodeEmbeddedLines extends InsertedRows {
  public override readonly beforeLine: number;
  public readonly document: TextDocument;
  public readonly startLine: number;
  public readonly lineCount: number;
  public readonly tokens: TokenCache | null;
  public readonly decorations: ICodeDecorations | null;

  public constructor(beforeLine: number, document: TextDocument, startLine: number,
    lineCount: number, tokens: TokenCache | null = null, decorations: ICodeDecorations | null = null) {
    super(beforeLine);
    TextPosition.requireCount(startLine, Resources.startLineParameter);
    TextPosition.requireCount(lineCount, Resources.lineCountParameter);
    if (startLine + lineCount > document.lineCount)
      throw new ArgumentOutOfRangeException(Resources.lineCountParameter, lineCount, Resources.formatPastDocument(document.lineCount));

    this.beforeLine = beforeLine;
    this.document = document;
    this.startLine = startLine;
    this.lineCount = lineCount;
    this.tokens = tokens;
    this.decorations = decorations;
  }

  public override get rowCount(): number {
    return this.lineCount;
  }

  /** @internal */
  public override get largestNumber(): number {
    return this.document.lineCount;
  }

  /** @internal */
  public override rowAt(builder: RowBuilder, _line: number, index: number): CodeRow {
    return builder.embeddedRow(this, this.startLine + index);
  }
}
