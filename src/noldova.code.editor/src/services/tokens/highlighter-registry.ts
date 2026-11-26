/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IHighlighter } from "../../interfaces/tokens/i-highlighter.js";
import type { ILanguageDefinition } from "../../interfaces/i-language-definition.js";
import type { ILineTokenizer } from "../../interfaces/tokens/i-line-tokenizer.js";
import { HighlighterAssignment } from "../../models/tokens/highlighter-assignment.js";
import { Registration } from "../../models/registration.js";
import { Resources } from "../../resources.js";
import type { EditorRegistries } from "../editor-registries.js";
import { RegistryEntries } from "../registry-entries.js";

export class HighlighterRegistry {
  private readonly registries: EditorRegistries;
  private readonly highlighters: RegistryEntries<IHighlighter>;
  private readonly assignments: RegistryEntries<HighlighterAssignment>;
  private readonly tokenizers: Map<string, Promise<ILineTokenizer | null>> = new Map();

  public constructor(registries: EditorRegistries, parent: HighlighterRegistry | null = null) {
    this.registries = registries;
    this.highlighters = new RegistryEntries(Resources.highlighterRegistry, t => t.id, parent?.highlighters ?? null);
    this.assignments = new RegistryEntries(Resources.highlighterAssignmentRegistry, t => t.languageId, parent?.assignments ?? null);
  }

  public register(highlighter: IHighlighter): Disposable {
    return this.changed(this.highlighters.add(highlighter));
  }

  public assign(languageId: string, highlighterId: string): Disposable {
    return this.changed(this.assignments.add(new HighlighterAssignment(languageId, highlighterId)));
  }

  public find(language: ILanguageDefinition): IHighlighter | null {
    const pinned: string | undefined = this.assignments.find(language.id)?.highlighterId;
    const assigned: IHighlighter | null = Object.isUndefined(pinned) ? null : this.highlighters.find(pinned);

    return assigned ?? [...this.highlighters.all()].reverse().find(t => t.supports(language)) ?? null;
  }

  public tokenizerAsync(language: ILanguageDefinition): Promise<ILineTokenizer | null> {
    const cached: Promise<ILineTokenizer | null> | undefined = this.tokenizers.get(language.id);
    if (!Object.isUndefined(cached))
      return cached;
    const highlighter: IHighlighter | null = this.find(language);
    const made: Promise<ILineTokenizer | null> = Object.isNull(highlighter) ? Promise.resolve(null) : highlighter.createAsync(language, this.registries);
    this.tokenizers.set(language.id, made);
    made.catch(() => {
      if (this.tokenizers.get(language.id) === made)
        this.tokenizers.delete(language.id);
    });

    return made;
  }

  private changed(registration: Disposable): Disposable {
    this.tokenizers.clear();

    return new Registration(() => {
      registration[Symbol.dispose]();
      this.tokenizers.clear();
    });
  }
}
