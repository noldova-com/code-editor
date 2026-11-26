/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";

import type { ITokenizerState } from "../../interfaces/tokens/i-tokenizer-state.js";
import type { LineToken } from "./line-token.js";

export class LineTokens {
  public readonly tokens: IReadOnlyList<LineToken>;
  public readonly endState: ITokenizerState;

  public constructor(tokens: IReadOnlyList<LineToken>, endState: ITokenizerState) {
    this.tokens = tokens;
    this.endState = endState;
  }
}
