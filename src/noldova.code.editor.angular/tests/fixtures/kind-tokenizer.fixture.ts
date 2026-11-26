/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type ILineTokenizer, type ITokenizerState, LineToken, LineTokens } from "@noldova/code.editor";
import type { IReadOnlyList } from "@noldova/context.collections";

import { TinyState } from "./tiny-state.fixture.ts";
import type { TokenKind } from "./token-kind.fixture.ts";

export class KindTokenizer implements ILineTokenizer {
  public readonly initialState: ITokenizerState = new TinyState(false);
  private readonly kinds: IReadOnlyList<TokenKind>;

  public constructor(kinds: IReadOnlyList<TokenKind>) {
    this.kinds = kinds;
  }

  public tokenizeLine(_: string, state: ITokenizerState): LineTokens {
    return new LineTokens(this.kinds.select((t, i) => new LineToken(i, i + 1, t.type, t.modifiers)).toList(), state);
  }
}
