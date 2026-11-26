/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { EditorRegistries, IHighlighter, ILanguageDefinition, ILineTokenizer } from "@noldova/code.editor";

import { NamedTokenizer } from "./named-tokenizer.fixture.js";

export class FakeHighlighter implements IHighlighter {
  public readonly id: string;
  public readonly made: string[] = [];
  public readonly registries: EditorRegistries[] = [];
  private readonly languages: readonly string[];
  private failures: number;

  public constructor(id: string, languages: readonly string[], failures: number = 0) {
    this.id = id;
    this.languages = languages;
    this.failures = failures;
  }

  public supports(language: ILanguageDefinition): boolean {
    return this.languages.includes(language.id);
  }

  public async createAsync(language: ILanguageDefinition, registries: EditorRegistries): Promise<ILineTokenizer> {
    this.made.push(language.id);
    this.registries.push(registries);
    await Promise.resolve();
    if (this.failures-- > 0)
      throw new Error(`${this.id} failed to load ${language.id}.`);

    return new NamedTokenizer(`${this.id}:${language.id}`);
  }
}
