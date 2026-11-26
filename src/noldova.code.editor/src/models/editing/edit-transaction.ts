/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { EditKind } from "../../enums/edit-kind.js";
import type { TextEdit } from "../text/text-edit.js";
import type { TextSelection } from "../text/text-selection.js";

export class EditTransaction {
  public readonly edits: IReadOnlyList<TextEdit>;
  public readonly kind: EditKind;
  public readonly time: number;
  public readonly selectionsBefore: IReadOnlyList<TextSelection>;
  public readonly selectionsAfter: IReadOnlyList<TextSelection>;

  public constructor(edits: IReadOnlyList<TextEdit>, kind: EditKind, time: number, selectionsBefore: IReadOnlyList<TextSelection>, selectionsAfter: IReadOnlyList<TextSelection>) {
    this.edits = edits;
    this.kind = kind;
    this.time = time;
    this.selectionsBefore = selectionsBefore;
    this.selectionsAfter = selectionsAfter;
  }
}
