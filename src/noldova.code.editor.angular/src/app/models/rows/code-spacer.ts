/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextPosition } from "@noldova/code.editor";

import { Resources } from "../../../resources.ts";
import type { CodeRow } from "./code-row.ts";
import { InsertedRows } from "./inserted-rows.ts";
import type { RowBuilder } from "./row-builder.ts";

export class CodeSpacer extends InsertedRows {
  public override readonly beforeLine: number;
  public override readonly rowCount: number;
  public readonly background: string | null;
  public readonly sign: string | null;
  public readonly signColor: string | null;

  public constructor(beforeLine: number, rowCount: number, background: string | null = null, sign: string | null = null, signColor: string | null = null) {
    super(beforeLine);
    TextPosition.requireCount(rowCount, Resources.rowCountParameter);

    this.beforeLine = beforeLine;
    this.rowCount = rowCount;
    this.background = background;
    this.sign = sign;
    this.signColor = signColor;
  }

  /** @internal */
  public override rowAt(builder: RowBuilder, line: number): CodeRow {
    return builder.spacerRow(this, line);
  }
}
