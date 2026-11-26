/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { type IReadOnlyList, List } from "@noldova/context.collections";

import type { ILanguageDefinition } from "../interfaces/i-language-definition.js";
import { LanguageFile } from "../models/languages/language-file.js";
import { Resources } from "../resources.js";
import { RegistryEntries } from "./registry-entries.js";

export class LanguageRegistry {
  private static readonly NO_NAMES: IReadOnlyList<string> = new List<string>();

  private readonly entries: RegistryEntries<ILanguageDefinition>;

  public constructor(parent: LanguageRegistry | null = null) {
    this.entries = new RegistryEntries(Resources.languageRegistry, t => t.id, parent?.entries ?? null);
  }

  public register(language: ILanguageDefinition): Disposable {
    return this.entries.add(language);
  }

  public find(id: string): ILanguageDefinition | null {
    return this.entries.find(id);
  }

  public named(name: string): ILanguageDefinition | null {
    const wanted: string = name.trim().toLowerCase();

    return this.all().firstOrDefault(t => t.id === wanted || (t.aliases ?? LanguageRegistry.NO_NAMES).any(a => a.toLowerCase() === wanted)) ?? null;
  }

  public forFile(path: string, firstLine: string | null = null): ILanguageDefinition | null {
    const file: LanguageFile = new LanguageFile(path);
    const languages: IReadOnlyList<ILanguageDefinition> = this.all();

    return languages.firstOrDefault(t => file.hasName(t.filenames ?? LanguageRegistry.NO_NAMES))
      ?? languages.firstOrDefault(t => file.matchesPattern(t.filenamePatterns ?? LanguageRegistry.NO_NAMES))
      ?? LanguageRegistry.byLongestExtension(file, languages)
      ?? (Object.isNull(firstLine) ? null : languages.firstOrDefault(t => LanguageRegistry.startsWith(t, firstLine)))
      ?? null;
  }

  public all(): IReadOnlyList<ILanguageDefinition> {
    return this.entries.all().reverse().toList();
  }

  private static byLongestExtension(file: LanguageFile, languages: IReadOnlyList<ILanguageDefinition>): ILanguageDefinition | null {
    let best: ILanguageDefinition | null = null;
    let length: number = 0;
    for (const language of languages)
      for (const extension of language.extensions ?? LanguageRegistry.NO_NAMES)
        if (extension.length > length && file.hasExtension(extension)) {
          best = language;
          length = extension.length;
        }

    return best;
  }

  private static startsWith(language: ILanguageDefinition, firstLine: string): boolean {
    return !Object.isUndefined(language.firstLine) && new RegExp(language.firstLine, Resources.unicodeFlag).test(firstLine);
  }
}
