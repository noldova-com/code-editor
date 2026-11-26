/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CodeFold } from "@noldova/code.editor.angular";
import { DiffSide, type UnchangedRegion } from "@noldova/code.editor.diff";
import { Dictionary, type IReadOnlyList, type IReadOnlySet } from "@noldova/context.collections";

export class DiffFolds {
  public readonly original: IReadOnlyList<CodeFold>;
  public readonly modified: IReadOnlyList<CodeFold>;
  private readonly keys: Dictionary<CodeFold, number>;

  public constructor(regions: IReadOnlyList<UnchangedRegion>, opened: IReadOnlySet<number>) {
    const keys: Dictionary<CodeFold, number> = new Dictionary<CodeFold, number>();
    const foldsOf = (side: DiffSide): IReadOnlyList<CodeFold> => regions.select(t => {
      const fold: CodeFold = new CodeFold(side === DiffSide.Original ? t.originalStart : t.modifiedStart, t.length, !opened.contains(t.originalStart));
      keys.set(fold, t.originalStart);

      return fold;
    }).toList();
    this.original = foldsOf(DiffSide.Original);
    this.modified = foldsOf(DiffSide.Modified);
    this.keys = keys;
  }

  public keyOf(fold: CodeFold): number {
    return this.keys.get(fold);
  }

  public hiding(folds: IReadOnlyList<CodeFold>, line: number): CodeFold | null {
    return folds.firstOrDefault(t => t.collapsed && line >= t.startLine && line < t.startLine + t.lineCount) ?? null;
  }
}
