/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TextRange } from "./text-range.js";

export class TextEdit {
  public readonly range: TextRange;
  public readonly text: string;

  public constructor(range: TextRange, text: string) {
    this.range = range;
    this.text = text;
  }
}
