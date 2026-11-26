/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ITokenizerState } from "@noldova/code.editor";

export class TinyState implements ITokenizerState {
  public readonly inComment: boolean;

  public constructor(inComment: boolean) {
    this.inComment = inComment;
  }

  public equals(other: ITokenizerState): boolean {
    return other instanceof TinyState && other.inComment === this.inComment;
  }
}
