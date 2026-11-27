/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Dictionary, type IReadOnlyList, List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CoreSettings, EditorRegistries, type ILanguageDefinition, LanguageDefinition, Required } from "@noldova/code.editor";
import { ScopeRule, ScopeRules, TextMateContribution, type TextMateGrammar, TextMateGrammarMissingException, TextMateHighlighter, TextMateLanguages, TextMateOptions, TextMateSettings }
  from "@noldova/code.editor.textmate";

import { PlainHighlighter } from "../fixtures/plain-highlighter.fixture.js";
import { Expect } from "../support/expect.js";
import { PatternWatch } from "../support/pattern-watch.js";

@TestClass
export class TextMateContributionTests {
  private static readonly PATTERN_CACHE_LIMIT: number = 10000;

  @TestMethod
  public registersThe33LanguagesEachFoundByItsIdOrAliasesWithAGrammarForEach(): void {
    const registries = TextMateContributionTests.registries();
    const names: readonly string[] = TextMateLanguages.definitions.selectMany(t => [t.id, ...(t.aliases ?? [])]).toArray();

    Assert.areEqual(33, TextMateLanguages.definitions.count());
    Assert.areEqual(names.length, new Set(names).size);
    Assert.isTrue(TextMateLanguages.definitions.all(t => TextMateLanguages.grammars.containsKey(t.id) && registries.languages.find(t.id) === t));
    Expect.same(["typescript", "go", "dockerfile", "makefile", "typescriptreact", null], [" TS ", "golang", "docker", "make", "tsx", "cobol"].map(t => registries.languages.named(t)?.id ?? null));
  }

  @TestMethod
  public findsAFilesLanguageFromItsWholeNamePatternExtensionOrFirstLine(): void {
    const registries = TextMateContributionTests.registries();
    const paths: readonly string[] = ["src/a.ts", "C:\\work\\b.PY", "x.d.ts", "Dockerfile", "build/Dockerfile.dev", "build/Makefile", "home/.bashrc", ".env.local", "tsconfig.json",
      "tsconfig.app.json", "package.json", "repo/.git/config", "notes.cobol", "README"];

    Expect.same(["typescript", "python", "typescript", "dockerfile", "dockerfile", "makefile", "shellscript", "shellscript", "jsonc", "jsonc", "json", "ini", null, null],
      paths.map(t => registries.languages.forFile(t)?.id ?? null));
    Expect.same(["javascript", "python", "shellscript", "php", "xml", null],
      ["#!/usr/bin/env node", "#!/usr/bin/python3", "#!/bin/bash", "<?php echo 1;", "<?xml version=\"1.0\"?>", "plain"].map(t => registries.languages.forFile("bin/run", t)?.id ?? null));
  }

  @TestMethod
  public givesEachLanguageItsIndentAndTheLineLengthLimitThroughTheSettings(): void {
    const registries = TextMateContributionTests.registries();

    Assert.areEqual(2000, registries.settings.get(TextMateSettings.lineLengthLimit, "typescript"));
    Assert.areEqual(TextMateSettings.lineLengthLimit, registries.settings.find(TextMateSettings.lineLengthLimit.id));
    Expect.same([4, 2], ["python", "typescript"].map(t => registries.settings.get(CoreSettings.indentSize, t)));
    Expect.same([false, true], ["go", "python"].map(t => registries.settings.get(CoreSettings.insertSpaces, t)));
  }

  @TestMethod
  public async letsAHostReplaceTheLanguagesAndScopeRulesAndAnotherHighlighterTakeALanguageOver(): Promise<void> {
    const registries = new EditorRegistries();
    const rules: IReadOnlyList<ScopeRule> = new List([...ScopeRules.defaults, new ScopeRule(new List(["storage.type"]), "keyword.declaration", new List(["readonly"]))]);
    registries.add(new TextMateContribution(new TextMateOptions(TextMateLanguages.definitions.where(t => t.id !== "makefile").toList(), undefined, rules)));
    const typescript = Required.value(registries.languages.find("typescript"));
    const tokenizer = Required.value(await registries.highlighters.tokenizerAsync(typescript));
    const tokens = tokenizer.tokenizeLine("const a = 1;", tokenizer.initialState);

    Assert.areEqual(null, registries.languages.named("make"));
    Expect.same(["keyword.declaration", "readonly"], [tokens.tokens.tryGet(0)?.type, ...(tokens.tokens.tryGet(0)?.modifiers ?? [])]);
    registries.highlighters.register(new PlainHighlighter());
    Assert.areEqual("plain", registries.highlighters.find(typescript)?.id);
    registries.highlighters.assign("typescript", "textmate");
    Assert.areEqual("textmate", registries.highlighters.find(typescript)?.id);
  }

  @TestMethod
  public async compilesEachPatternOnceForEveryTokenizerTheHighlighterMakes(): Promise<void> {
    const registries = TextMateContributionTests.registries();
    const typescript = Required.value(registries.languages.find("typescript"));
    const highlighter = new TextMateHighlighter(TextMateLanguages.grammars);
    const first = await highlighter.createAsync(typescript, registries);
    const second = await highlighter.createAsync(typescript, registries);

    const firstCompiled: number = PatternWatch.compiledWhile(() => first.tokenizeLine("const a = 1;", first.initialState));
    const secondCompiled: number = PatternWatch.compiledWhile(() => second.tokenizeLine("const a = 1;", second.initialState));

    Expect.same([true, 0], [firstCompiled > 0, secondCompiled]);
  }

  @TestMethod
  public async keepsItsCompiledPatternsWithinTheLimitAsEachHeredocDelimiterAddsOneCompilingTheGrammarsOwnOnce(): Promise<void> {
    const registries = TextMateContributionTests.registries();
    const shell = Required.value(registries.languages.find("shellscript"));
    const tokenizer = await new TextMateHighlighter(TextMateLanguages.grammars).createAsync(shell, registries);
    let state = tokenizer.initialState;
    const tokenize = (from: number, to: number): void => {
      for (let heredoc: number = from; heredoc < to; heredoc++)
        for (const line of [`cat <<END${heredoc}`, "text", `END${heredoc}`])
          state = tokenizer.tokenizeLine(line, state).endState;
    };

    tokenize(0, 1);
    const one: number = PatternWatch.compiledWhile(() => tokenize(1, 2));
    const thousand: number = PatternWatch.compiledWhile(() => tokenize(2, 1002));
    const largest: number = PatternWatch.largestWhile(() => tokenize(1002, TextMateContributionTests.PATTERN_CACHE_LIMIT + 500));

    Expect.same([true, one * 1000, TextMateContributionTests.PATTERN_CACHE_LIMIT], [one > 0, thousand, largest]);
  }

  @TestMethod
  public async refusesALanguageItHasNoGrammarFor(): Promise<void> {
    const highlighter = new TextMateHighlighter(new Dictionary<string, TextMateGrammar>());
    const cobol: ILanguageDefinition = new LanguageDefinition("cobol");

    const error: unknown = await highlighter.createAsync(cobol, new EditorRegistries()).then(() => null, (t: unknown) => t);

    Assert.areEqual(false, highlighter.supports(cobol));
    Assert.isTrue(error instanceof TextMateGrammarMissingException && error.languageId === "cobol" && error.message.includes("\"cobol\""));
  }

  private static registries(): EditorRegistries {
    const registries = new EditorRegistries();
    registries.add(new TextMateContribution());

    return registries;
  }
}
