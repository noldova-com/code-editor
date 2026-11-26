/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CodeBlock } from "../folding/code-block.ts";

export class LayoutRow {
  public readonly line: number;
  public readonly block: CodeBlock | null;
  public readonly index: number;

  public constructor(line: number, block: CodeBlock | null, index: number) {
    this.line = line;
    this.block = block;
    this.index = index;
  }
}
