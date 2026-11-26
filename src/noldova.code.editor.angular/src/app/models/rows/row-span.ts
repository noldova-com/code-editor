/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class RowSpan {
  public readonly start: number;
  public readonly end: number;
  public readonly background: string;

  public constructor(start: number, end: number, background: string) {
    this.start = start;
    this.end = end;
    this.background = background;
  }
}
