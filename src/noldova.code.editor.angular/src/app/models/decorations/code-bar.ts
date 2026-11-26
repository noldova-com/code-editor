/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { CodeBarAction } from "./code-bar-action.ts";
import type { CodeRow } from "../rows/code-row.ts";
import { InsertedRows } from "../rows/inserted-rows.ts";
import type { RowBuilder } from "../rows/row-builder.ts";

export class CodeBar extends InsertedRows {
  public override readonly beforeLine: number;
  public readonly id: string;
  public readonly note: string;
  public readonly icon: string | null;
  public readonly actions: IReadOnlyList<CodeBarAction>;
  public readonly background: string | null;
  public readonly color: string | null;

  public constructor(id: string, beforeLine: number, note: string,
    icon: string | null, actions: IReadOnlyList<CodeBarAction>, background: string | null = null, color: string | null = null) {
    super(beforeLine);
    this.beforeLine = beforeLine;
    this.id = id;
    this.note = note;
    this.icon = icon;
    this.actions = actions;
    this.background = background;
    this.color = color;
  }

  public override get rowCount(): number {
    return 1;
  }

  /** @internal */
  public override rowAt(builder: RowBuilder): CodeRow {
    return builder.barRow(this);
  }
}
