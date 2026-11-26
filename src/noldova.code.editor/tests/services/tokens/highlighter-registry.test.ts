/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { EditorRegistries, type ILanguageDefinition, type ILineTokenizer, LanguageDefinition, RegistrationExistsException } from "@noldova/code.editor";

import { FakeHighlighter } from "../../fixtures/fake-highlighter.fixture.js";
import { NamedTokenizer } from "../../fixtures/named-tokenizer.fixture.js";
import { Expect } from "../../support/expect.js";

@TestClass
export class HighlighterRegistryTests {
  private static readonly PYTHON: ILanguageDefinition = new LanguageDefinition("python");
  private static readonly RUST: ILanguageDefinition = new LanguageDefinition("rust");
  private static readonly COBOL: ILanguageDefinition = new LanguageDefinition("cobol");

  @TestMethod
  public async givesALanguageToTheLastRegisteredHighlighterThatSupportsItAndBackOnceThatOneIsDisposed(): Promise<void> {
    const registries = new EditorRegistries();
    const textMate = new FakeHighlighter("textmate", ["python", "rust"]);
    registries.highlighters.register(textMate);
    const treeSitter = registries.highlighters.register(new FakeHighlighter("tree-sitter", ["python"]));

    Assert.areEqual("tree-sitter:python", await HighlighterRegistryTests.nameOf(registries, HighlighterRegistryTests.PYTHON));
    Assert.areEqual("textmate:rust", await HighlighterRegistryTests.nameOf(registries, HighlighterRegistryTests.RUST));
    Assert.areEqual(null, await registries.highlighters.tokenizerAsync(HighlighterRegistryTests.COBOL));
    treeSitter[Symbol.dispose]();

    Assert.areEqual("textmate:python", await HighlighterRegistryTests.nameOf(registries, HighlighterRegistryTests.PYTHON));
    Assert.areEqual(registries, textMate.registries[0]);
  }

  @TestMethod
  public async pinsALanguageToTheAssignedHighlighterAndFallsBackWhenNoHighlighterHasThatId(): Promise<void> {
    const registries = new EditorRegistries();
    registries.highlighters.register(new FakeHighlighter("textmate", ["python"]));
    registries.highlighters.register(new FakeHighlighter("tree-sitter", ["python"]));
    const pinned = registries.highlighters.assign("python", "textmate");

    Assert.areEqual("textmate", registries.highlighters.find(HighlighterRegistryTests.PYTHON)?.id);
    Expect.throwsWhere(() => registries.highlighters.assign("python", "tree-sitter"), RegistrationExistsException, t => t.id === "python");
    pinned[Symbol.dispose]();
    registries.highlighters.assign("python", "gone");

    Assert.areEqual("tree-sitter", registries.highlighters.find(HighlighterRegistryTests.PYTHON)?.id);
  }

  @TestMethod
  public async makesALanguagesTokenizerOnceAndAgainAfterAChangeOrAFailedLoad(): Promise<void> {
    const registries = new EditorRegistries();
    const highlighter = new FakeHighlighter("textmate", ["python", "rust"], 1);
    registries.highlighters.register(highlighter);

    const failed: string = await registries.highlighters.tokenizerAsync(HighlighterRegistryTests.PYTHON).then(() => "made", (error: unknown) => String(error));
    const first = await registries.highlighters.tokenizerAsync(HighlighterRegistryTests.PYTHON);
    const second = await registries.highlighters.tokenizerAsync(HighlighterRegistryTests.PYTHON);
    registries.highlighters.register(new FakeHighlighter("other", []))[Symbol.dispose]();
    const third = await registries.highlighters.tokenizerAsync(HighlighterRegistryTests.PYTHON);

    Assert.areEqual("Error: textmate failed to load python.", failed);
    Assert.areEqual(first, second);
    Assert.areNotEqual(first, third);
    Expect.same(["python", "python", "python"], highlighter.made);
    Expect.throwsWhere(() => registries.highlighters.register(new FakeHighlighter("textmate", [])), RegistrationExistsException, t => t.id === "textmate");
  }

  @TestMethod
  public async letsAChildSetTakeALanguageOverAndFallsBackToItsParentsHighlightersAndPins(): Promise<void> {
    const app = new EditorRegistries();
    app.highlighters.register(new FakeHighlighter("textmate", ["python", "rust"]));
    app.highlighters.register(new FakeHighlighter("tree-sitter", ["rust"]));
    app.highlighters.assign("rust", "textmate");
    const editor = new EditorRegistries(app);
    const own = new FakeHighlighter("tree-sitter", ["python"]);
    editor.highlighters.register(own);

    Assert.areEqual("tree-sitter:python", await HighlighterRegistryTests.nameOf(editor, HighlighterRegistryTests.PYTHON));
    Assert.areEqual("textmate:python", await HighlighterRegistryTests.nameOf(app, HighlighterRegistryTests.PYTHON));
    Assert.areEqual("textmate", editor.highlighters.find(HighlighterRegistryTests.RUST)?.id);
    Assert.areEqual(editor, own.registries[0]);
  }

  private static async nameOf(registries: EditorRegistries, language: ILanguageDefinition): Promise<string | null> {
    const tokenizer: ILineTokenizer | null = await registries.highlighters.tokenizerAsync(language);

    return tokenizer instanceof NamedTokenizer ? tokenizer.name : null;
  }
}
