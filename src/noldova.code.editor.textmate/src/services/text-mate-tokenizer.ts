/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { codeToTokensBase, createShikiPrimitive, getLastGrammarState } from "@shikijs/primitive";
import type { ShikiPrimitive } from "@shikijs/primitive";
import type { CodeToTokensBaseOptions, GrammarState, LanguageInput, RegexEngine, ThemedToken } from "@shikijs/primitive/types";

import "@noldova/context.core";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { type ILineTokenizer, type ITokenizerState, LineToken, LineTokens, Required } from "@noldova/code.editor";

import type { ScopeRule } from "../models/scope-rule.js";
import { TextMateState } from "../models/text-mate-state.js";
import { Resources } from "../resources.js";
import { ScopeRules } from "./scope-rules.js";

export class TextMateTokenizer implements ILineTokenizer, Disposable {
  public readonly initialState: ITokenizerState = new TextMateState(null, Resources.themeName);
  private readonly primitive: ShikiPrimitive;
  private readonly options: CodeToTokensBaseOptions;

  private constructor(primitive: ShikiPrimitive, grammar: string, lineLengthLimit: number) {
    this.primitive = primitive;
    this.options = { lang: grammar, theme: Resources.themeName, tokenizeMaxLineLength: lineLengthLimit + 1, tokenizeTimeLimit: Resources.noTimeLimit };
  }

  public static async createAsync(grammar: string, load: LanguageInput, engine: RegexEngine, rules: IReadOnlyList<ScopeRule> = ScopeRules.defaults,
    lineLengthLimit: number = Resources.lineLengthLimit): Promise<TextMateTokenizer> {
    const primitive: ShikiPrimitive = createShikiPrimitive({ engine, themes: [ScopeRules.themeOf(rules)] });
    await primitive.loadLanguage(load);

    return new TextMateTokenizer(primitive, grammar, lineLengthLimit);
  }

  public tokenizeLine(text: string, state: ITokenizerState): LineTokens {
    const grammarState: GrammarState | null = state instanceof TextMateState ? state.grammarState : null;
    const lines: ThemedToken[][] = codeToTokensBase(this.primitive, text, Object.isNull(grammarState) ? this.options : { ...this.options, grammarState });
    const end: GrammarState = Required.value(getLastGrammarState(this.primitive, lines));
    const tokens: List<LineToken> = new List<LineToken>();
    for (const line of lines)
      for (const token of line) {
        const rule: ScopeRule | null = ScopeRules.ruleOf(token.color);
        if (!Object.isNull(rule) && !Object.isNull(rule.type))
          tokens.add(new LineToken(token.offset, token.offset + token.content.length, rule.type, rule.modifiers));
      }

    return new LineTokens(tokens, new TextMateState(end, Resources.themeName));
  }

  public [Symbol.dispose](): void {
    this.primitive.dispose();
  }
}
