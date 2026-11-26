/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { LineTokens } from "../../models/tokens/line-tokens.js";
import type { ITokenizerState } from "./i-tokenizer-state.js";

export interface ILineTokenizer {
  readonly initialState: ITokenizerState;

  tokenizeLine(text: string, state: ITokenizerState): LineTokens;
}
