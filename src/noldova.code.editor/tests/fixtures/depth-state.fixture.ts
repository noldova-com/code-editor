/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ITokenizerState } from "@noldova/code.editor";

export class DepthState implements ITokenizerState {
  public readonly depth: number;

  public constructor(depth: number) {
    this.depth = depth;
  }

  public equals(other: ITokenizerState): boolean {
    return other instanceof DepthState && other.depth === this.depth;
  }
}
