/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TextRange } from "../text/text-range.js";

export class AppliedEdit {
  public readonly oldRange: TextRange;
  public readonly newRange: TextRange;
  public readonly oldText: string;
  public readonly text: string;
  public readonly oldOffset: number;

  public constructor(oldRange: TextRange, newRange: TextRange, oldText: string, text: string, oldOffset: number) {
    this.oldRange = oldRange;
    this.newRange = newRange;
    this.oldText = oldText;
    this.text = text;
    this.oldOffset = oldOffset;
  }
}
