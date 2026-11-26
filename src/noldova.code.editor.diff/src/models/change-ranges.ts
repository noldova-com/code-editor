/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TextRange } from "@noldova/code.editor";
import type { IReadOnlyList } from "@noldova/context.collections";

export class ChangeRanges {
  public readonly original: IReadOnlyList<TextRange>;
  public readonly modified: IReadOnlyList<TextRange>;

  public constructor(original: IReadOnlyList<TextRange>, modified: IReadOnlyList<TextRange>) {
    this.original = original;
    this.modified = modified;
  }
}
