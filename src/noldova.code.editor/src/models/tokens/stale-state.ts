/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ITokenizerState } from "../../interfaces/tokens/i-tokenizer-state.js";

export class StaleState implements ITokenizerState {
  public equals(_other: ITokenizerState): boolean {
    return false;
  }
}
