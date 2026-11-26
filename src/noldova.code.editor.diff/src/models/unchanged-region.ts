/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class UnchangedRegion {
  public readonly originalStart: number;
  public readonly modifiedStart: number;
  public readonly length: number;

  public constructor(originalStart: number, modifiedStart: number, length: number) {
    this.originalStart = originalStart;
    this.modifiedStart = modifiedStart;
    this.length = length;
  }
}
