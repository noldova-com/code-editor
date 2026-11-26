/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiffSide } from "../enums/diff-side.js";

export class LineChange {
  public readonly index: number;
  public readonly originalStart: number;
  public readonly originalEnd: number;
  public readonly modifiedStart: number;
  public readonly modifiedEnd: number;

  public constructor(index: number, originalStart: number, originalEnd: number, modifiedStart: number, modifiedEnd: number) {
    this.index = index;
    this.originalStart = originalStart;
    this.originalEnd = originalEnd;
    this.modifiedStart = modifiedStart;
    this.modifiedEnd = modifiedEnd;
  }

  public get originalLength(): number {
    return this.originalEnd - this.originalStart;
  }

  public get modifiedLength(): number {
    return this.modifiedEnd - this.modifiedStart;
  }

  public startOf(side: DiffSide): number {
    return side === DiffSide.Original ? this.originalStart : this.modifiedStart;
  }

  public endOf(side: DiffSide): number {
    return side === DiffSide.Original ? this.originalEnd : this.modifiedEnd;
  }
}
