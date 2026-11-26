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

import type { ScopeRule } from "../models/scope-rule.js";
import type { TextMateGrammar } from "../models/text-mate-grammar.js";

export interface ITextMateOptions {
  readonly languages?: IReadOnlyList<ILanguageDefinition> | undefined;
  readonly grammars?: IReadOnlyDictionary<string, TextMateGrammar> | undefined;
  readonly rules?: IReadOnlyList<ScopeRule> | undefined;
  readonly settings?: Readonly<Record<string, unknown>> | undefined;
  readonly engine?: (() => RegexEngine) | undefined;
}
