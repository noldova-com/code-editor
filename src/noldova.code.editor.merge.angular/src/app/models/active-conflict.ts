/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ConflictState } from "@noldova/code.editor.merge";

export class ActiveConflict {
  public readonly index: number;
  public readonly count: number;
  public readonly base: string | null;
  public readonly state: ConflictState;
  public readonly firstLine: number;
  public readonly lastLine: number;

  public constructor(index: number, count: number, base: string | null, state: ConflictState, firstLine: number, lastLine: number) {
    this.index = index;
    this.count = count;
    this.base = base;
    this.state = state;
    this.firstLine = firstLine;
    this.lastLine = lastLine;
  }
}
