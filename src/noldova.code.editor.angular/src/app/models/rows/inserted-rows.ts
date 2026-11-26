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
import type { RowBuilder } from "./row-builder.ts";

export abstract class InsertedRows {
  public abstract readonly beforeLine: number;

  protected constructor(beforeLine: number) {
    TextPosition.requireCount(beforeLine, Resources.beforeLineParameter);
  }

  /** @internal */
  public get largestNumber(): number {
    return 0;
  }

  public abstract readonly rowCount: number;

  /** @internal */
  public abstract rowAt(builder: RowBuilder, line: number, index: number): CodeRow;
}
