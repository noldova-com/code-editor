/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ITokenizerState } from "@noldova/code.editor";

export class PlainState implements ITokenizerState {
  public equals(): boolean {
    return true;
  }
}
