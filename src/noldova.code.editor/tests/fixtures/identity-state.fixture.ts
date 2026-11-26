/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ITokenizerState } from "@noldova/code.editor";

export class IdentityState implements ITokenizerState {
  public equals(other: ITokenizerState): boolean {
    return other === this;
  }
}
