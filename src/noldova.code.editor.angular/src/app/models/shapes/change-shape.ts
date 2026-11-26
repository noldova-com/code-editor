/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class ChangeShape {
  public readonly top: number;
  public readonly left: number;
  public readonly width: number;
  public readonly background: string;

  public constructor(top: number, left: number, width: number, background: string) {
    this.top = top;
    this.left = left;
    this.width = width;
    this.background = background;
  }
}
