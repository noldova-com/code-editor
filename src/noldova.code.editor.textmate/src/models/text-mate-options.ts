/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RegexEngine } from "@shikijs/primitive/types";

import type { IReadOnlyDictionary, IReadOnlyList } from "@noldova/context.collections";

import type { ILanguageDefinition } from "@noldova/code.editor";

import type { ITextMateOptions } from "../interfaces/i-text-mate-options.js";
import type { ScopeRule } from "./scope-rule.js";
import type { TextMateGrammar } from "./text-mate-grammar.js";

export class TextMateOptions implements ITextMateOptions {
  public readonly languages: IReadOnlyList<ILanguageDefinition> | undefined;
  public readonly grammars: IReadOnlyDictionary<string, TextMateGrammar> | undefined;
  public readonly rules: IReadOnlyList<ScopeRule> | undefined;
  public readonly settings: Readonly<Record<string, unknown>> | undefined;
  public readonly engine: (() => RegexEngine) | undefined;

  public constructor(languages: IReadOnlyList<ILanguageDefinition> | undefined = undefined, grammars: IReadOnlyDictionary<string, TextMateGrammar> | undefined = undefined,
    rules: IReadOnlyList<ScopeRule> | undefined = undefined, settings: Readonly<Record<string, unknown>> | undefined = undefined,
    engine: (() => RegexEngine) | undefined = undefined) {
    this.languages = languages;
    this.grammars = grammars;
    this.rules = rules;
    this.settings = settings;
    this.engine = engine;
  }
}
