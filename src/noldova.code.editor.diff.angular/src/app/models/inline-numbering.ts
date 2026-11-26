/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { ICodeNumbering } from "@noldova/code.editor.angular";
import { DiffSide, type DocumentDiff, type LineChange } from "@noldova/code.editor.diff";

export class InlineNumbering implements ICodeNumbering {
  public readonly largest: number;
  private readonly diff: DocumentDiff;

  public constructor(diff: DocumentDiff) {
    this.diff = diff;
    this.largest = Math.max(diff.original.lineCount, diff.modified.lineCount);
  }

  public numberOf(line: number): number | null {
    if (!Object.isNull(this.diff.changeAt(line, DiffSide.Modified)))
      return null;
    const change: LineChange | undefined = this.diff.changes.lastOrDefault(t => t.modifiedEnd <= line);

    return (Object.isUndefined(change) ? line : line - change.modifiedEnd + change.originalEnd) + 1;
  }
}
