/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BuiltInTokenTypes, type ILineTokenizer, type ITokenizerState, LineToken, LineTokens } from "@noldova/code.editor";
import { List } from "@noldova/context.collections";

import { CommentState } from "./comment-state.fixture.ts";

export class CommentTokenizer implements ILineTokenizer {
  public readonly initialState: ITokenizerState = new CommentState(false);

  public tokenizeLine(text: string, state: ITokenizerState): LineTokens {
    const open: boolean = text === "/*" || state instanceof CommentState && state.open;

    return new LineTokens(new List<LineToken>([new LineToken(0, text.length, open ? BuiltInTokenTypes.comment.id : BuiltInTokenTypes.keyword.id)]), new CommentState(open));
  }
}
