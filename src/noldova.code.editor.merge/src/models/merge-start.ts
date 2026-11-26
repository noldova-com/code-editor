/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { MergeConflict } from "./merge-conflict.js";

export class MergeStart {
  public readonly text: string;
  public readonly conflicts: IReadOnlyList<MergeConflict>;

  public constructor(text: string, conflicts: IReadOnlyList<MergeConflict>) {
    this.text = text;
    this.conflicts = conflicts;
  }
}
