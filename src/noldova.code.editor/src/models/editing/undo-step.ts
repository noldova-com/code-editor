/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { EditKind } from "../../enums/edit-kind.js";
import type { TextChange } from "../text/text-change.js";
import type { TextSelection } from "../text/text-selection.js";

export class UndoStep {
  public readonly kind: EditKind;
  public readonly changes: TextChange[];
  public readonly selectionsBefore: IReadOnlyList<TextSelection>;
  public selectionsAfter: IReadOnlyList<TextSelection>;
  public lastTime: number;
  public sealed: boolean;

  public constructor(kind: EditKind, changes: TextChange[], selectionsBefore: IReadOnlyList<TextSelection>, selectionsAfter: IReadOnlyList<TextSelection>, lastTime: number, sealed: boolean) {
    this.kind = kind;
    this.changes = changes;
    this.selectionsBefore = selectionsBefore;
    this.selectionsAfter = selectionsAfter;
    this.lastTime = lastTime;
    this.sealed = sealed;
  }
}
