/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { AppliedEdit } from "../editing/applied-edit.js";
import { TextEdit } from "./text-edit.js";

export class TextChange {
  public readonly version: number;
  public readonly edits: IReadOnlyList<AppliedEdit>;

  public constructor(version: number, edits: IReadOnlyList<AppliedEdit>) {
    this.version = version;
    this.edits = edits;
  }

  public inverse(): IReadOnlyList<TextEdit> {
    return this.edits.select(t => new TextEdit(t.newRange, t.oldText)).toList();
  }
}
