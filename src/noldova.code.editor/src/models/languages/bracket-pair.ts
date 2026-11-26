/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class BracketPair {
  public readonly open: string;
  public readonly close: string;

  public constructor(open: string, close: string) {
    this.open = open;
    this.close = close;
  }
}
