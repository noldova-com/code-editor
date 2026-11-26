/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type EditorRegistries, type IHighlighter, type ILanguageDefinition, type ILineTokenizer, LanguageDefinition } from "@noldova/code.editor";

export class FixedHighlighter implements IHighlighter {
  private static count: number = 0;
  public readonly id: string;
  private readonly language: ILanguageDefinition;
  private readonly load: () => Promise<ILineTokenizer>;

  private constructor(id: string, language: ILanguageDefinition, load: () => Promise<ILineTokenizer>) {
    this.id = id;
    this.language = language;
    this.load = load;
  }

  public static register(registries: EditorRegistries, load: () => Promise<ILineTokenizer>): ILanguageDefinition {
    FixedHighlighter.count += 1;
    const language: ILanguageDefinition = new LanguageDefinition(`fixed-language-${FixedHighlighter.count}`);
    registries.languages.register(language);
    registries.highlighters.register(new FixedHighlighter(`fixed-highlighter-${FixedHighlighter.count}`, language, load));

    return language;
  }

  public supports(language: ILanguageDefinition): boolean {
    return language === this.language;
  }

  public createAsync(): Promise<ILineTokenizer> {
    return this.load();
  }
}
