/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { ApplicationRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { type ILanguageDefinition, type ILineTokenizer, LanguageDefinition } from "@noldova/code.editor";
import { describe, expect, it } from "vitest";

import { FixedHighlighter } from "../../fixtures/fixed-highlighter.fixture.ts";
import { PlainTokenizer } from "../../fixtures/plain-tokenizer.fixture.ts";
import { TokenizerFixture } from "../../fixtures/tokenizer.fixture.ts";

const UNKNOWN_LANGUAGE: string = "unknown-language";
const UNSUPPORTED_LANGUAGE: ILanguageDefinition = new LanguageDefinition("unsupported-language");

describe("LanguageTokenizer", () => {
  it("makes the tokenizer of a language given by its definition or its id, and none for no language or an id the app lacks", async () => {
    const view: TokenizerFixture = new TokenizerFixture();
    const made: ILineTokenizer = new PlainTokenizer();
    const language: ILanguageDefinition = FixedHighlighter.register(view.registries, () => Promise.resolve(made));

    const read: readonly (ILineTokenizer | null)[] = [await view.readAsync(language), await view.readAsync(language.id), await view.readAsync(UNKNOWN_LANGUAGE),
      await view.readAsync(null)];

    expect(read).toEqual([made, made, null, null]);
  });

  it("gives null while the tokenizer loads, then the tokenizer, and null for good when no highlighter supports the language or its load fails", async () => {
    const view: TokenizerFixture = new TokenizerFixture();
    const pending: PromiseWithResolvers<ILineTokenizer> = Promise.withResolvers<ILineTokenizer>();
    const made: ILineTokenizer = new PlainTokenizer();
    const slow: ILanguageDefinition = FixedHighlighter.register(view.registries, () => pending.promise);
    const failing: ILanguageDefinition = FixedHighlighter.register(view.registries, () => Promise.reject(new Error("The grammar did not load.")));
    view.registries.languages.register(UNSUPPORTED_LANGUAGE);
    view.language.set(slow);
    TestBed.tick();
    const loading: ILineTokenizer | null = view.tokenizer();
    pending.resolve(made);
    await TestBed.inject(ApplicationRef).whenStable();
    const loaded: ILineTokenizer | null = view.tokenizer();

    const read: readonly (ILineTokenizer | null)[] = [loading, loaded, await view.readAsync(UNSUPPORTED_LANGUAGE), await view.readAsync(failing)];

    expect(read).toEqual([null, made, null, null]);
  });
});
