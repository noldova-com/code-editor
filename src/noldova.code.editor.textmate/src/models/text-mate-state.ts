/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getGrammarStack } from "@shikijs/primitive";
import type { GrammarState } from "@shikijs/primitive/types";

import "@noldova/context.core";

import type { ITokenizerState } from "@noldova/code.editor";

import type { GrammarStack } from "../types/grammar-stack.js";

export class TextMateState implements ITokenizerState {
  public readonly grammarState: GrammarState | null;
  private readonly stack: GrammarStack;

  public constructor(grammarState: GrammarState | null, theme: string) {
    this.grammarState = grammarState;
    this.stack = Object.isNull(grammarState) ? undefined : getGrammarStack(grammarState, theme);
  }

  public equals(other: ITokenizerState): boolean {
    if (!(other instanceof TextMateState))
      return false;
    if (Object.isUndefined(this.stack) || Object.isUndefined(other.stack))
      return this.stack === other.stack;

    return this.stack.equals(other.stack);
  }
}
