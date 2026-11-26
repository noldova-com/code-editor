/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TextDocument, TextEdit, TextRange, TokenCache } from "@noldova/code.editor";

import { DepthTokenizer } from "../../fixtures/depth-tokenizer.fixture.js";
import { ChunkWatch } from "../../support/chunk-watch.js";
import { Expect } from "../../support/expect.js";

@TestClass
export class TokenCacheTests {
  @TestMethod
  public tokenizesLinesOnlyUpToTheOneAskedEachOnceCarryingTheStateFromLineToLine(): void {
    const document = TextDocument.fromText("a (\nb\nc )\nd\ne");
    const tokenizer = new DepthTokenizer();
    using cache = new TokenCache(document, tokenizer);

    Assert.areEqual("comment", cache.tokensOf(1).tokens.tryGet(0)?.type);
    Assert.areEqual(2, cache.validLineCount);
    Expect.same(["comment", "comment", "variable", "variable", "variable"], TokenCacheTests.kinds(cache, 5));
    Expect.same(["a (", "b", "c )", "d", "e"], tokenizer.seen);
  }

  @TestMethod
  public tokenizesAnEditedLineAgainAndStopsOnceALineEndsInTheStateItEndedInBefore(): void {
    const document = TextDocument.fromText("a\nb\nc\nd");
    const tokenizer = new DepthTokenizer();
    using cache = new TokenCache(document, tokenizer);
    TokenCacheTests.kinds(cache, 4);
    tokenizer.seen.length = 0;

    TokenCacheTests.edit(document, 1, 0, 1, 1, "B");
    Assert.areEqual(1, cache.validLineCount);
    Expect.same(["variable", "variable", "variable", "variable"], TokenCacheTests.kinds(cache, 4));
    Expect.same(["B"], tokenizer.seen);
    Assert.areEqual(4, cache.validLineCount);
  }

  @TestMethod
  public tokenizesTheLinesAfterAnEditThatChangesTheStateUntilTheStateSettles(): void {
    const document = TextDocument.fromText("a\nb\nc ))\nd");
    const tokenizer = new DepthTokenizer();
    using cache = new TokenCache(document, tokenizer);
    TokenCacheTests.kinds(cache, 4);
    tokenizer.seen.length = 0;

    TokenCacheTests.edit(document, 0, 1, 0, 1, " (");

    Expect.same(["comment", "comment", "variable", "variable"], TokenCacheTests.kinds(cache, 4));
    Expect.same(["a (", "b", "c ))"], tokenizer.seen);
  }

  @TestMethod
  public tokenizesEveryEditedLineOfAChangeThoughAnEarlierOneSettles(): void {
    const document = TextDocument.fromText("a\nb\nc\nd");
    const tokenizer = new DepthTokenizer();
    using cache = new TokenCache(document, tokenizer);
    TokenCacheTests.kinds(cache, 4);
    tokenizer.seen.length = 0;

    document.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "A"), new TextEdit(TextRange.of(2, 1, 2, 1), " (")]));

    Expect.same(["variable", "variable", "comment", "comment"], TokenCacheTests.kinds(cache, 4));
    Expect.same(["A", "c (", "d"], tokenizer.seen);
  }

  @TestMethod
  public followsEditsThatAddOrRemoveLinesSeveralInOneChange(): void {
    const document = TextDocument.fromText("a\nb\nc\nd\ne");
    const tokenizer = new DepthTokenizer();
    using cache = new TokenCache(document, tokenizer);
    TokenCacheTests.kinds(cache, 5);
    tokenizer.seen.length = 0;

    document.apply(new List([new TextEdit(TextRange.of(3, 0, 4, 0), ""), new TextEdit(TextRange.of(0, 1, 0, 1), "\n(x\ny")]));

    Expect.same("a\n(x\ny\nb\nc\ne", document.text());
    Expect.same(["variable", "comment", "comment", "comment", "comment", "comment"], TokenCacheTests.kinds(cache, 6));
    Expect.same(["a", "(x", "y", "b", "c", "e"], tokenizer.seen);
    Assert.throws(() => cache.tokensOf(6), ArgumentOutOfRangeException);
  }

  @TestMethod
  public stopsFollowingTheDocumentOnceDisposed(): void {
    const document = TextDocument.fromText("a\nb");
    const cache = new TokenCache(document, new DepthTokenizer());
    TokenCacheTests.kinds(cache, 2);

    cache[Symbol.dispose]();
    TokenCacheTests.edit(document, 0, 0, 0, 1, "(");

    Assert.areEqual(2, cache.validLineCount);
  }

  @TestMethod
  public givesALineFarPastTheTokenizedOnesProvisionalTokensFromTheLessIndentedLinesAmongThe50AboveItAndContinuesThemForTheNextLine(): void {
    const text = (i: number): string => {
      if (i === 0 || i === 95)
        return "(";
      if (i === 110)
        return "g(";
      if (i === 120)
        return "  h(";
      if (i === 140)
        return "";

      return i > 110 && i < 120 ? `  k ${i}` : i > 120 ? `    line ${i}` : `line ${i}`;
    };
    const document = TextDocument.fromText(Array.from({ length: 200 }, (_, i) => text(i)).join("\n"));
    const tokenizer = new DepthTokenizer();
    using cache = new TokenCache(document, tokenizer);

    Assert.areEqual("comment", cache.tokensOf(150).tokens.tryGet(0)?.type);
    Assert.areEqual("comment", cache.tokensOf(150).tokens.tryGet(0)?.type);
    Assert.areEqual("comment", cache.tokensOf(151).tokens.tryGet(0)?.type);
    Expect.same([["g(", "  h(", "    line 150", "    line 151"], 0], [tokenizer.seen, cache.validLineCount]);
  }

  @TestMethod
  public startsAProvisionalLineFromTheInitialStateWhenNoLineAmongThe50AboveItIsLessIndented(): void {
    const document = TextDocument.fromText(["(", ...Array.from({ length: 199 }, (_, i) => i < 100 ? `line ${i + 1}` : `  line ${i + 1}`)].join("\n"));
    const tokenizer = new DepthTokenizer();
    using cache = new TokenCache(document, tokenizer);

    Assert.areEqual("variable", cache.tokensOf(60).tokens.tryGet(0)?.type);
    Assert.areEqual("variable", cache.tokensOf(180).tokens.tryGet(0)?.type);
    Expect.same(["line 60", "  line 180"], tokenizer.seen);
  }

  @TestMethod
  public tokenizesInTheBackgroundAtLeastALineEachTimeAndOnWhileThereIsTimeAndGivesExactTokensWhereItHasBeen(): void {
    const document = TextDocument.fromText(["(", ...Array.from({ length: 199 }, (_, i) => `line ${i + 1}`)].join("\n"));
    using cache = new TokenCache(document, new DepthTokenizer());
    cache.tokensOf(150);

    Assert.areEqual(true, cache.advance(() => false));
    Assert.areEqual(1, cache.validLineCount);
    Assert.areEqual(false, cache.advance(() => true));
    Assert.areEqual(200, cache.validLineCount);
    Assert.areEqual(false, cache.advance(() => true));

    Assert.areEqual("comment", cache.tokensOf(150).tokens.tryGet(0)?.type);
  }

  @TestMethod
  public dropsTheProvisionalTokensASettledEditPassesAndKeepsThosePastTheNextEditedLine(): void {
    const document = TextDocument.fromText(Array.from({ length: 300 }, (_, i) => `line ${i}`).join("\n"));
    const tokenizer = new DepthTokenizer();
    using cache = new TokenCache(document, tokenizer);
    cache.advance(() => true);

    document.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "L"), new TextEdit(TextRange.of(150, 0, 150, 0), "(")]));
    cache.tokensOf(100);
    cache.tokensOf(250);
    tokenizer.seen.length = 0;
    cache.tokensOf(0);
    cache.tokensOf(250);
    cache.tokensOf(100);

    Expect.same(["Line 0"], tokenizer.seen);
    Assert.areEqual(150, cache.validLineCount);
  }

  @TestMethod
  public followsAnEditToA1000000LineDocumentWithoutReadingItsLinesCopyingOnlyTheChunkEachEditReachesAndReReadsOnlyTheLinesTheEditsReach(): void {
    const lines: readonly string[] = Array.from({ length: 1_000_000 }, (_, i) => `line ${i}`);
    const document = TextDocument.fromText(lines.join("\n"));
    const tokenizer = new DepthTokenizer();
    using cache = new TokenCache(document, tokenizer);
    cache.tokensOf(100);
    const read: number = tokenizer.seen.length;

    const watch: ChunkWatch = new ChunkWatch();
    watch.whileEditing(() => {
      for (let line: number = 50; line < 70; line++)
        TokenCacheTests.edit(document, line, 0, line, 0, "x\n");
    });
    const touched: readonly number[] = watch.replacedLineCounts;
    const readByEdits: number = tokenizer.seen.length - read;
    const type: string | undefined = cache.tokensOf(100).tokens.tryGet(0)?.type;

    Assert.areEqual(0, readByEdits);
    Assert.areEqual("variable", type);
    Assert.isTrue(tokenizer.seen.length - read <= 100 - 50 + 1, `Reading line 100 again re-read ${tokenizer.seen.length - read} lines.`);
    Assert.areEqual(20, touched.length);
    Assert.isTrue(Math.max(...touched) < 1000, `The edits copied chunks of ${touched.join(", ")} lines.`);
  }

  private static edit(document: TextDocument, startLine: number, startColumn: number, endLine: number, endColumn: number, text: string): void {
    document.apply(new List([new TextEdit(TextRange.of(startLine, startColumn, endLine, endColumn), text)]));
  }

  private static kinds(cache: TokenCache, count: number): readonly string[] {
    return Array.from({ length: count }, (_, i) => cache.tokensOf(i).tokens.select(t => t.type).toArray().join());
  }
}
