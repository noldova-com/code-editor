/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RegexEngine } from "@shikijs/primitive/types";

import type { IReadOnlyDictionary, IReadOnlyList } from "@noldova/context.collections";

import type { EditorRegistries, IEditorContribution, ILanguageDefinition } from "@noldova/code.editor";

import type { ITextMateOptions } from "../interfaces/i-text-mate-options.js";
import type { ScopeRule } from "../models/scope-rule.js";
import type { TextMateGrammar } from "../models/text-mate-grammar.js";
import { TextMateOptions } from "../models/text-mate-options.js";
import { Resources } from "../resources.js";
import { ScopeRules } from "./scope-rules.js";
import { TextMateHighlighter } from "./text-mate-highlighter.js";
import { TextMateLanguages } from "./text-mate-languages.js";
import { TextMateSettings } from "./text-mate-settings.js";

export class TextMateContribution implements IEditorContribution {
  public readonly id: string = Resources.contributionId;
  private readonly languages: IReadOnlyList<ILanguageDefinition>;
  private readonly grammars: IReadOnlyDictionary<string, TextMateGrammar>;
  private readonly rules: IReadOnlyList<ScopeRule>;
  private readonly settings: Readonly<Record<string, unknown>>;
  private readonly engine: (() => RegexEngine) | undefined;

  public constructor(options: ITextMateOptions = new TextMateOptions()) {
    this.languages = options.languages ?? TextMateLanguages.definitions;
    this.grammars = options.grammars ?? TextMateLanguages.grammars;
    this.rules = options.rules ?? ScopeRules.defaults;
    this.settings = options.settings ?? TextMateLanguages.settings;
    this.engine = options.engine;
  }

  public contribute(registries: EditorRegistries): void {
    for (const language of this.languages)
      registries.languages.register(language);
    registries.highlighters.register(new TextMateHighlighter(this.grammars, this.rules, this.engine));
    registries.settings.declare(TextMateSettings.lineLengthLimit);
    registries.settings.addLanguageDefaults(this.settings);
  }
}
