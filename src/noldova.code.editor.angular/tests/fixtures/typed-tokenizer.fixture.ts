/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ILineTokenizer, type ITokenizerState, LineToken, LineTokens } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";

import { PlainState } from "./plain-state.fixture.ts";

export class TypedTokenizer implements ILineTokenizer {
  public readonly initialState: ITokenizerState = new PlainState();
  private readonly types: readonly string[];

  public constructor(types: readonly string[]) {
    this.types = types;
  }

  public tokenizeLine(_: string, state: ITokenizerState): LineTokens {
    return new LineTokens(new List<LineToken>(this.types.map((t, i) => new LineToken(i, i + 1, t))), state);
  }
}
