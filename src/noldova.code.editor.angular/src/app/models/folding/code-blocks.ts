/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { ICodeDecorations } from "../../interfaces/i-code-decorations.ts";
import { CodeBlock } from "./code-block.ts";
import type { CodeFold } from "./code-fold.ts";
import type { CodeInsertedRows } from "../rows/code-inserted-rows.ts";

export class CodeBlocks {
  public readonly blocks: readonly CodeBlock[];
  public readonly largestNumber: number;

  public constructor(lineCount: number, layers: IReadOnlyList<ICodeDecorations>, folds: IReadOnlyList<CodeFold>) {
    const collapsed: readonly CodeBlock[] = CodeBlocks.collapsedOf(lineCount, folds);
    const rows: readonly CodeInsertedRows[] = layers.selectMany(t => t.rows)
      .where(t => t.rowCount > 0 && t.beforeLine <= lineCount && !collapsed.some(u => t.beforeLine > u.line && t.beforeLine < u.line + u.hidden)).toArray();
    const inserted: readonly CodeBlock[] = rows.map(t => new CodeBlock(t.beforeLine, t.rowCount, 0, t, null));
    this.blocks = [...inserted, ...collapsed].sort((a, b) => a.line - b.line || a.hidden - b.hidden);
    this.largestNumber = rows.reduce((a, t) => Math.max(a, t.largestNumber),
      layers.aggregate(lineCount, (a, t) => Math.max(a, t.numbering?.largest ?? 0)));
  }

  private static collapsedOf(lineCount: number, folds: IReadOnlyList<CodeFold>): readonly CodeBlock[] {
    const kept: CodeBlock[] = [];
    let end: number = 0;
    for (const fold of folds.where(t => t.collapsed && t.startLine < lineCount).orderBy(t => t.startLine)) {
      const hidden: number = Math.min(fold.lineCount, lineCount - fold.startLine);
      if (hidden === 0 || fold.startLine < end)
        continue;
      kept.push(new CodeBlock(fold.startLine, 1, hidden, null, fold));
      end = fold.startLine + hidden;
    }

    return kept;
  }
}
