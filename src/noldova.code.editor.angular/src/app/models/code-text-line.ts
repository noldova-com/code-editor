/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type ILineTokenizer, type ITokenizerState, LineSplit, type LineTokens } from "@noldova/code.editor";
import type { IReadOnlyList } from "@noldova/context.collections";

import { CodeTextSpan } from "./code-text-span.ts";

export class CodeTextLine {
  public readonly spans: readonly CodeTextSpan[];

  public constructor(spans: readonly CodeTextSpan[]) {
    this.spans = spans;
  }

  public static linesOf(text: string, tokenizer: ILineTokenizer | null): IReadOnlyList<CodeTextLine> {
    const texts: IReadOnlyList<string> = LineSplit.of(text).texts;
    const count: number = texts.count();
    const shown: number = count > 1 && String.isNullOrEmpty(texts.get(count - 1)) ? count - 1 : count;
    let state: ITokenizerState | null = tokenizer?.initialState ?? null;

    return texts.take(shown).select(line => {
      if (Object.isNull(tokenizer) || Object.isNull(state))
        return new CodeTextLine([new CodeTextSpan(line, null)]);
      const tokens: LineTokens = tokenizer.tokenizeLine(line, state);
      state = tokens.endState;

      return new CodeTextLine(CodeTextLine.spansOf(line, tokens));
    }).toList();
  }

  private static spansOf(line: string, tokens: LineTokens): readonly CodeTextSpan[] {
    const spans: CodeTextSpan[] = [];
    let at: number = 0;
    for (const token of tokens.tokens) {
      if (token.start > at)
        spans.push(new CodeTextSpan(line.slice(at, token.start), null));
      spans.push(new CodeTextSpan(line.slice(token.start, token.end), token.type, token.modifiers));
      at = token.end;
    }
    if (at < line.length || spans.length === 0)
      spans.push(new CodeTextSpan(line.slice(at), null));

    return spans;
  }
}
