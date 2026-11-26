/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";

import { type ILineTokenizer, type ITokenizerState, type LineToken, LineTokens } from "@noldova/code.editor";

import { IdentityState } from "./identity-state.fixture.js";

export class NamedTokenizer implements ILineTokenizer {
  public readonly initialState: ITokenizerState = new IdentityState();
  public readonly name: string;

  public constructor(name: string) {
    this.name = name;
  }

  public tokenizeLine(_text: string, state: ITokenizerState): LineTokens {
    return new LineTokens(new List<LineToken>(), state);
  }
}
