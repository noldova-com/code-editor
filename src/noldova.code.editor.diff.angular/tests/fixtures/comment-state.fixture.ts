/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ITokenizerState } from "@noldova/code.editor";

export class CommentState implements ITokenizerState {
  public readonly open: boolean;

  public constructor(open: boolean) {
    this.open = open;
  }

  public equals(other: ITokenizerState): boolean {
    return other instanceof CommentState && other.open === this.open;
  }
}
