/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TextRange } from "@noldova/code.editor";

export class CodeRangeDecoration {
  public readonly range: TextRange;
  public readonly background: string;

  public constructor(range: TextRange, background: string) {
    this.range = range;
    this.background = background;
  }
}
