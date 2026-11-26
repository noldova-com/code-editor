/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { computed, inject, resource, type ResourceRef, type Signal } from "@angular/core";
import type { EditorRegistries, ILanguageDefinition, ILineTokenizer } from "@noldova/code.editor";

import { CodeEditorRegistries } from "../services/code-editor-registries.ts";

export class LanguageTokenizer {
  public static of(language: Signal<string | ILanguageDefinition | null>): Signal<ILineTokenizer | null> {
    const registries: EditorRegistries = inject(CodeEditorRegistries).registries;
    const loaded: ResourceRef<ILineTokenizer | null | undefined> = resource({
      params: language,
      loader: ({ params }) => LanguageTokenizer.loadAsync(registries, params)
    });

    return computed(() => loaded.hasValue() ? loaded.value() : null);
  }

  private static loadAsync(registries: EditorRegistries, language: string | ILanguageDefinition | null): Promise<ILineTokenizer | null> {
    const definition: ILanguageDefinition | null = Object.isString(language) ? registries.languages.find(language) : language;

    return Object.isNull(definition) ? Promise.resolve(null) : registries.highlighters.tokenizerAsync(definition);
  }
}
