/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class MatchShape {
  public readonly top: number;
  public readonly left: number;
  public readonly width: number;
  public readonly current: boolean;

  public constructor(top: number, left: number, width: number, current: boolean) {
    this.top = top;
    this.left = left;
    this.width = width;
    this.current = current;
  }
}
