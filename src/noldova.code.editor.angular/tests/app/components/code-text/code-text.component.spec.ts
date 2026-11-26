/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { BuiltInTokenTypes, type ILanguageDefinition, type ILineTokenizer, TokenTypeDefinition } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";
import { describe, expect, it } from "vitest";

import type { CodeTextComponent } from "../../../../src/app/components/code-text/code-text.component.ts";
import { CodeEditorRegistries } from "../../../../src/app/services/code-editor-registries.ts";
import { CodeTextFixture } from "../../../fixtures/code-text.fixture.ts";
import { FixedHighlighter } from "../../../fixtures/fixed-highlighter.fixture.ts";
import { KindTokenizer } from "../../../fixtures/kind-tokenizer.fixture.ts";
import { PageStyle } from "../../../fixtures/page-style.fixture.ts";
import { StyleColor } from "../../../fixtures/style-color.fixture.ts";
import { TinyTokenizer } from "../../../fixtures/tiny-tokenizer.fixture.ts";
import { TokenKind } from "../../../fixtures/token-kind.fixture.ts";

describe("CodeTextComponent", () => {
  it("colors each token by its kind, keeps the text between tokens plain, and carries the tokenizer's state from line to line", async () => {
    const fixture: ComponentFixture<CodeTextComponent> = CodeTextFixture.render("let a = 1;\nx /* open\nstill */ let b\n", new TinyTokenizer());
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    expect(CodeTextFixture.runs(host)).toEqual([
      ["nol-code-text-token-keyword:let", " a = 1;"],
      ["x ", "nol-code-text-token-comment:/* open"],
      ["nol-code-text-token-comment:still */", " let b"]
    ]);
    expect([getComputedStyle(host.querySelector(".nol-code-text-token-keyword") ?? host).color, getComputedStyle(host.querySelector(".nol-code-text-token-comment") ?? host).color])
      .toEqual([PageStyle.styleOf(StyleColor.Text, "--nol-code-keyword", host), PageStyle.styleOf(StyleColor.Text, "--nol-code-comment", host)]);
  });

  it("shows the text plain until its language's tokenizer is ready, then colors it", async () => {
    const pending: PromiseWithResolvers<ILineTokenizer> = Promise.withResolvers<ILineTokenizer>();
    const language: ILanguageDefinition = FixedHighlighter.register(TestBed.inject(CodeEditorRegistries).registries, () => pending.promise);
    const fixture: ComponentFixture<CodeTextComponent> = CodeTextFixture.renderLanguage("let a", language.id);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const plain: readonly (readonly string[])[] = CodeTextFixture.runs(host);
    pending.resolve(new TinyTokenizer());
    await fixture.whenStable();

    expect([plain, CodeTextFixture.runs(host)]).toEqual([[["let a"]], [["nol-code-text-token-keyword:let", " a"]]]);
  });

  it("shows the text plain without a tokenizer, one line a row, an empty line a row of its own", async () => {
    const fixture: ComponentFixture<CodeTextComponent> = CodeTextFixture.render("a\n\n  b", null);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const rows: readonly HTMLElement[] = [...host.querySelectorAll<HTMLElement>(".nol-code-text-line")];
    const height: number = Number.parseFloat(getComputedStyle(host).lineHeight);

    expect(CodeTextFixture.runs(host)).toEqual([["a"], [""], ["  b"]]);
    expect(rows.map(t => Math.round(t.getBoundingClientRect().height - height))).toEqual([0, 0, 0]);
    expect([getComputedStyle(host).whiteSpace, host.querySelectorAll("[class^='nol-code-text-token']").length]).toEqual(["pre", 0]);
  });

  it("colors every built-in token type with its code color from the kit", async () => {
    const types: readonly string[] = BuiltInTokenTypes.types.select(t => t.id).toArray();
    const variables: ReadonlyMap<string, string> = new Map([["keyword.control", "--nol-code-control"], ["string.regexp", "--nol-code-regex"]]);
    const fixture: ComponentFixture<CodeTextComponent> = CodeTextFixture.render("x".repeat(types.length), new KindTokenizer(new List<TokenKind>(types.map(t => new TokenKind(t)))));
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const spans: readonly HTMLElement[] = [...host.querySelectorAll<HTMLElement>(".nol-code-text-line > span")];

    expect(spans.map(t => getComputedStyle(t).color))
      .toEqual(types.map(t => PageStyle.styleOf(StyleColor.Text, variables.get(t) ?? `--nol-code-${t}`, host)));
  });

  it("colors an app's own type by its parent's color, styles its modifiers from their variables, and leaves an unknown type plain", async () => {
    TestBed.inject(CodeEditorRegistries).registries.tokenTypes.registerType(new TokenTypeDefinition("keyword.declaration", undefined, "keyword"));
    const kinds: IReadOnlyList<TokenKind> = new List<TokenKind>([new TokenKind("keyword.declaration", ["deprecated"]), new TokenKind("keyword"), new TokenKind("made.up", ["unregistered"])]);
    const fixture: ComponentFixture<CodeTextComponent> = CodeTextFixture.render("abc", new KindTokenizer(kinds));
    const host: HTMLElement = fixture.nativeElement;
    host.style.setProperty("--nol-code-modifier-deprecated-text-decoration", "line-through");
    await fixture.whenStable();
    const [declared, keyword] = [...host.querySelectorAll<HTMLElement>(".nol-code-text-line > span")].map(t => getComputedStyle(t));

    expect(CodeTextFixture.runs(host)).toEqual([["nol-code-text-token-keyword-declaration nol-code-text-token-modifier-deprecated:a", "nol-code-text-token-keyword:b", "c"]]);
    expect([declared?.color, declared?.textDecorationLine, keyword?.textDecorationLine])
      .toEqual([PageStyle.styleOf(StyleColor.Text, "--nol-code-keyword", host), "line-through", "none"]);
  });
});
