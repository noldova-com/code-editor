/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Assert, TestClass, TestMethod, Timeout } from "@noldova/context.testing";

import { EditorRegistries, type ILineTokenizer, type LineTokens, Required } from "@noldova/code.editor";
import { TextMateContribution, TextMateLanguages, TextMateSettings, TextMateTokenizer } from "@noldova/code.editor.textmate";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";

import { StaleState } from "../fixtures/stale-state.fixture.js";
import { Expect } from "../support/expect.js";

@TestClass
export class TextMateTokenizerTests {
  @TestMethod
  @Timeout(60_000)
  public async loadsEveryDefaultLanguagesGrammarOnlyWhenAskedAndTokenizesALineWithIt(): Promise<void> {
    const registries = TextMateTokenizerTests.registries();

    for (const language of TextMateLanguages.definitions) {
      const tokenizer = await TextMateTokenizerTests.tokenizer(registries, language.id);
      Assert.areEqual(false, tokenizer.tokenizeLine("x", tokenizer.initialState).endState.equals(tokenizer.initialState), language.id);
    }
  }

  @TestMethod
  public async givesEachPartOfALineItsTypeLeavingOperatorsAndPunctuationPlain(): Promise<void> {
    const typescript = await TextMateTokenizerTests.tokenizer(TextMateTokenizerTests.registries(), "ts");
    const text = "const answer = 42; if (/a+/.test(s)) return; // note";

    const tokens = typescript.tokenizeLine(text, typescript.initialState);

    Expect.same(["keyword", "variable", "number", "keyword.control", "string.regexp", "keyword.control", "comment", null],
      ["const", "answer", "42", "if", "a+", "return", "// note", "="].map(t => TextMateTokenizerTests.typeOf(text, tokens, t)));
    Assert.isTrue(tokens.tokens.all(t => t.start < t.end && t.end <= text.length && t.modifiers.count() === 0));
  }

  @TestMethod
  public async carriesACommentThatCrossesLinesInTheStateBetweenThem(): Promise<void> {
    const typescript = await TextMateTokenizerTests.tokenizer(TextMateTokenizerTests.registries(), "typescript");

    const first = typescript.tokenizeLine("let a = 1; /* open", typescript.initialState);
    const second = typescript.tokenizeLine("still */ let b = 3;", first.endState);
    const plain = typescript.tokenizeLine("let c = 2;", typescript.initialState);

    Assert.areEqual("comment", TextMateTokenizerTests.typeOf("still */ let b = 3;", second, "still"));
    Assert.areEqual("keyword", TextMateTokenizerTests.typeOf("still */ let b = 3;", second, "let"));
    Assert.areEqual(false, first.endState.equals(plain.endState));
    Assert.areEqual(true, second.endState.equals(plain.endState));
    Assert.areEqual(true, typescript.initialState.equals(typescript.initialState));
    Assert.areEqual(false, typescript.initialState.equals(plain.endState));
    Assert.areEqual(false, plain.endState.equals(typescript.initialState));
    Assert.areEqual(false, plain.endState.equals(new StaleState()));
  }

  @TestMethod
  public async carriesTheStateOfALineThatTakesLongerThanHalfASecondToTokenize(): Promise<void> {
    const typescript = await TextMateTokenizerTests.tokenizer(TextMateTokenizerTests.registries(), "typescript");
    const now = Date.now.bind(Date);
    let reads = 0;
    Date.now = () => now() + 1000 * ++reads;
    let first: LineTokens;
    try {
      first = typescript.tokenizeLine("let a = 1; /* open", typescript.initialState);
    } finally {
      Date.now = now;
    }

    const second = typescript.tokenizeLine("still */ let b = 3;", first.endState);

    Assert.areEqual("keyword", TextMateTokenizerTests.typeOf("let a = 1; /* open", first, "let"));
    Assert.areEqual("comment", TextMateTokenizerTests.typeOf("let a = 1; /* open", first, "open"));
    Assert.areEqual("comment", TextMateTokenizerTests.typeOf("still */ let b = 3;", second, "still"));
  }

  @TestMethod
  public async startsFromTheBeginningForAStateOfAnotherKindAndLeavesALinePastTheLengthLimitPlain(): Promise<void> {
    const python = await TextMateTokenizerTests.tokenizer(TextMateTokenizerTests.registries(), "py");
    const long = `x = "${"a".repeat(2001)}"`;

    const tokens = python.tokenizeLine("def f(): pass", new StaleState());

    Assert.areEqual("keyword", TextMateTokenizerTests.typeOf("def f(): pass", tokens, "def"));
    Assert.areEqual("function", TextMateTokenizerTests.typeOf("def f(): pass", tokens, "f()"));
    Assert.areEqual(false, tokens.endState.equals(new StaleState()));
    Expect.same([], python.tokenizeLine(long, python.initialState).tokens.toArray());
  }

  @TestMethod
  public async takesTheLengthLimitFromTheSettingForTheLanguageOrTheUser(): Promise<void> {
    const registries = TextMateTokenizerTests.registries();
    registries.settings.setUserValues({ [TextMateSettings.lineLengthLimit.id]: 12, "[python]": { [TextMateSettings.lineLengthLimit.id]: 4 } });

    const python = await TextMateTokenizerTests.tokenizer(registries, "python");
    const typescript = await TextMateTokenizerTests.tokenizer(registries, "typescript");

    Expect.same([], python.tokenizeLine("def f(): pass", python.initialState).tokens.toArray());
    Expect.same([], typescript.tokenizeLine("const answer = 42;", typescript.initialState).tokens.toArray());
    Assert.areEqual("keyword", TextMateTokenizerTests.typeOf("const a=1;", typescript.tokenizeLine("const a=1;", typescript.initialState), "const"));
  }

  @TestMethod
  public async freesItsGrammarsOnceDisposedSoItTokenizesNoMore(): Promise<void> {
    const tokenizer = await TextMateTokenizer.createAsync("typescript", () => import("@shikijs/langs/typescript"), createJavaScriptRegexEngine());
    const before: number = tokenizer.tokenizeLine("const a = 1;", tokenizer.initialState).tokens.count();
    tokenizer[Symbol.dispose]();

    let after: string = "tokenized";
    try {
      tokenizer.tokenizeLine("const a = 1;", tokenizer.initialState);
    } catch (error: unknown) {
      after = error instanceof Error ? error.name : String(error);
    }
    Assert.isTrue(before > 0);
    Assert.areNotEqual("tokenized", after);
  }

  private static registries(): EditorRegistries {
    const registries = new EditorRegistries();
    registries.add(new TextMateContribution());

    return registries;
  }

  private static async tokenizer(registries: EditorRegistries, name: string): Promise<ILineTokenizer> {
    const tokenizer: ILineTokenizer | null = await registries.highlighters.tokenizerAsync(Required.value(registries.languages.named(name)));
    Assert.isNotNull(tokenizer);

    return tokenizer;
  }

  private static typeOf(text: string, tokens: LineTokens, part: string): string | null {
    const start = text.indexOf(part);

    return tokens.tokens.firstOrDefault(t => t.start <= start && start < t.end)?.type ?? null;
  }
}
