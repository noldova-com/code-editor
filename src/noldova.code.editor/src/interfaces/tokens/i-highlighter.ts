/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { EditorRegistries } from "../../services/editor-registries.js";
import type { ILanguageDefinition } from "../i-language-definition.js";
import type { ILineTokenizer } from "./i-line-tokenizer.js";

export interface IHighlighter {
  readonly id: string;

  supports(language: ILanguageDefinition): boolean;
  createAsync(language: ILanguageDefinition, registries: EditorRegistries): Promise<ILineTokenizer>;
}
