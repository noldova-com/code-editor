/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import type { RegexEngine } from "@shikijs/primitive/types";

import "@noldova/context.core";
import type { IReadOnlyDictionary, IReadOnlyList } from "@noldova/context.collections";

import type { EditorRegistries, IHighlighter, ILanguageDefinition, ILineTokenizer } from "@noldova/code.editor";

import { TextMateGrammarMissingException } from "../exceptions/text-mate-grammar-missing.exception.js";
import type { ScopeRule } from "../models/scope-rule.js";
import type { TextMateGrammar } from "../models/text-mate-grammar.js";
import { Resources } from "../resources.js";
import { ScopeRules } from "./scope-rules.js";
import { TextMateSettings } from "./text-mate-settings.js";
import { TextMateTokenizer } from "./text-mate-tokenizer.js";

export class TextMateHighlighter implements IHighlighter {
  public readonly id: string = Resources.highlighterId;
  private readonly grammars: IReadOnlyDictionary<string, TextMateGrammar>;
  private readonly rules: IReadOnlyList<ScopeRule>;
  private readonly engine: () => RegexEngine;

  public constructor(grammars: IReadOnlyDictionary<string, TextMateGrammar>, rules: IReadOnlyList<ScopeRule> = ScopeRules.defaults,
    engine: () => RegexEngine = () => createJavaScriptRegexEngine({ forgiving: true })) {
    this.grammars = grammars;
    this.rules = rules;
    this.engine = engine;
  }

  public supports(language: ILanguageDefinition): boolean {
    return this.grammars.containsKey(language.id);
  }

  public async createAsync(language: ILanguageDefinition, registries: EditorRegistries): Promise<ILineTokenizer> {
    const grammar: TextMateGrammar | undefined = this.grammars.tryGet(language.id);
    if (Object.isUndefined(grammar))
      throw new TextMateGrammarMissingException(language.id);
    const limit: number = registries.settings.get(TextMateSettings.lineLengthLimit, language.id);

    return TextMateTokenizer.createAsync(grammar.name, grammar.load, this.engine(), this.rules, limit);
  }
}
