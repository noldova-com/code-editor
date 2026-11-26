/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ILineTokenizer, type ITokenizerState, LineToken, LineTokens } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";

import { TinyState } from "./tiny-state.fixture.ts";

export class TinyTokenizer implements ILineTokenizer {
  public readonly initialState: ITokenizerState = new TinyState(false);

  public tokenizeLine(text: string, state: ITokenizerState): LineTokens {
    const open: boolean = state instanceof TinyState && state.inComment;
    if (open || text.includes("/*")) {
      const start: number = open ? 0 : text.indexOf("/*");
      const end: number = text.includes("*/") ? text.indexOf("*/") + 2 : text.length;

      return new LineTokens(new List<LineToken>([new LineToken(start, end, "comment")]), new TinyState(!text.includes("*/")));
    }
    const tokens: LineToken[] = [...text.matchAll(/\blet\b/g)].map(t => new LineToken(t.index, t.index + 3, "keyword"));

    return new LineTokens(new List<LineToken>(tokens), this.initialState);
  }
}
