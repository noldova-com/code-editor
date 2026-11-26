/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BuiltInTokenTypes, type ILineTokenizer, type ITokenizerState, LineToken, LineTokens } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";

import { PlainState } from "./plain-state.fixture.ts";

export class KeywordTokenizer implements ILineTokenizer {
  public readonly initialState: ITokenizerState = new PlainState();

  public tokenizeLine(text: string, state: ITokenizerState): LineTokens {
    const start: number = text.indexOf("const");

    return new LineTokens(new List<LineToken>(start < 0 ? [] : [new LineToken(start, start + 5, BuiltInTokenTypes.keyword.id)]), state);
  }
}
