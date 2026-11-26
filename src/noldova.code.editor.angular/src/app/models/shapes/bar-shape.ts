/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CodeBar } from "../decorations/code-bar.ts";

export class BarShape {
  public readonly top: number;
  public readonly bar: CodeBar;

  public constructor(top: number, bar: CodeBar) {
    this.top = top;
    this.bar = bar;
  }
}
