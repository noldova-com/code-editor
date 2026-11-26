/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ApplicationRef, signal, type Signal, type WritableSignal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { EditorRegistries, ILanguageDefinition, ILineTokenizer } from "@noldova/code.editor";

import { LanguageTokenizer } from "../../src/app/models/language-tokenizer.ts";
import { CodeEditorRegistries } from "../../src/app/services/code-editor-registries.ts";

export class TokenizerFixture {
  public readonly registries: EditorRegistries = TestBed.inject(CodeEditorRegistries).registries;
  public readonly language: WritableSignal<string | ILanguageDefinition | null> = signal<string | ILanguageDefinition | null>(null);
  public readonly tokenizer: Signal<ILineTokenizer | null> = TestBed.runInInjectionContext(() => LanguageTokenizer.of(this.language));

  public async readAsync(language: string | ILanguageDefinition | null): Promise<ILineTokenizer | null> {
    this.language.set(language);
    TestBed.tick();
    await TestBed.inject(ApplicationRef).whenStable();

    return this.tokenizer();
  }
}
