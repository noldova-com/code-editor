/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CodeFold } from "./code-fold.ts";
import type { CodeInsertedRows } from "../rows/code-inserted-rows.ts";

export class CodeBlock {
  public readonly line: number;
  public readonly length: number;
  public readonly hidden: number;
  public readonly rows: CodeInsertedRows | null;
  public readonly fold: CodeFold | null;

  public constructor(line: number, length: number, hidden: number, rows: CodeInsertedRows | null, fold: CodeFold | null) {
    this.line = line;
    this.length = length;
    this.hidden = hidden;
    this.rows = rows;
    this.fold = fold;
  }
}
