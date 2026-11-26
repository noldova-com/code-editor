/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";

import { type ILineTokenizer, type ITokenizerState, LineToken, LineTokens } from "@noldova/code.editor";

import { DepthState } from "./depth-state.fixture.js";

export class DepthTokenizer implements ILineTokenizer {
  public readonly initialState: ITokenizerState = new DepthState(0);
  public readonly seen: string[] = [];

  public tokenizeLine(text: string, state: ITokenizerState): LineTokens {
    this.seen.push(text);
    const start: number = state instanceof DepthState ? state.depth : 0;
    const depth: number = Math.max(0, start + text.split("(").length - text.split(")").length);

    return new LineTokens(new List([new LineToken(0, text.length, depth > 0 ? "comment" : "variable")]), new DepthState(depth));
  }
}
