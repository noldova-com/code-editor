/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Required } from "@noldova/code.editor";

import type { CodeBlock } from "../folding/code-block.ts";
import { LayoutRow } from "./layout-row.ts";

export class RowLayout {
  public readonly rowCount: number;
  private readonly blocks: readonly CodeBlock[];
  private readonly lines: readonly number[];
  private readonly starts: readonly number[];
  private readonly before: readonly number[];

  public constructor(lineCount: number, blocks: readonly CodeBlock[]) {
    const starts: number[] = [];
    const before: number[] = [0];
    for (const block of blocks) {
      starts.push(block.line + Required.at(before, before.length - 1));
      before.push(Required.at(before, before.length - 1) + block.length - block.hidden);
    }
    this.blocks = blocks;
    this.lines = blocks.map(t => t.line);
    this.starts = starts;
    this.before = before;
    this.rowCount = lineCount + Required.at(before, blocks.length);
  }

  public rowOfLine(line: number): number {
    const count: number = RowLayout.countUpTo(this.lines, line);

    return this.hidingAt(line, count) ? Required.at(this.starts, count - 1) : line + Required.at(this.before, count);
  }

  public rowAt(row: number): LayoutRow {
    const count: number = RowLayout.countUpTo(this.starts, row);
    const block: CodeBlock | undefined = this.blocks[count - 1];
    const start: number = this.starts[count - 1] ?? 0;
    if (!Object.isUndefined(block) && row < start + block.length)
      return new LayoutRow(block.line, block, row - start);

    return new LayoutRow(row - Required.at(this.before, count), null, 0);
  }

  private hidingAt(line: number, count: number): boolean {
    const block: CodeBlock | undefined = this.blocks[count - 1];

    return !Object.isUndefined(block) && line < block.line + block.hidden;
  }

  private static countUpTo(values: readonly number[], value: number): number {
    let low: number = 0;
    let high: number = values.length;
    while (low < high) {
      const middle: number = Math.floor((low + high) / 2);
      if (Required.at(values, middle) <= value)
        low = middle + 1;
      else
        high = middle;
    }

    return low;
  }
}
