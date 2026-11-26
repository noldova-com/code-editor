/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { ArgumentException, ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { EditsOverlapException, TextDocument, TextEdit, TextPosition, TextRange } from "@noldova/code.editor";

import { ReferenceText } from "../../fixtures/reference-text.fixture.js";
import { SeededRandom } from "../../fixtures/seeded-random.fixture.js";
import { ChunkWatch } from "../../support/chunk-watch.js";
import { Expect } from "../../support/expect.js";

@TestClass
export class TextDocumentTests {
  @TestMethod
  public keepsEachLinesBreakAsReadAndWritesTheTextBackUnchanged(): void {
    const document = TextDocument.fromText("a\r\nbb\nc\rd");

    Assert.areEqual(4, document.lineCount);
    Expect.same(["a", "bb", "c", "d"], [0, 1, 2, 3].map(t => document.lineText(t)));
    Expect.same(["\r\n", "\n", "\r", ""], [0, 1, 2, 3].map(t => document.lineEnding(t)));
    Assert.areEqual("a\r\nbb\nc\rd", document.text());
    Assert.areEqual(9, document.length);
    Assert.areEqual(0, document.version);
  }

  @TestMethod
  public hasOneEmptyLineWhenEmpty(): void {
    const document = TextDocument.fromText("");

    Assert.areEqual(1, document.lineCount);
    Assert.areEqual("", document.lineText(0));
    Assert.areEqual(0, document.length);
    Assert.isTrue(document.positionAt(0).equals(new TextPosition(0, 0)));
  }

  @TestMethod
  public mapsOffsetsAndPositionsBothWaysAndAnOffsetInsideACRLFToItsLinesEnd(): void {
    const document = TextDocument.fromText("ab\r\ncd\nef");

    Assert.areEqual(5, document.offsetAt(new TextPosition(1, 1)));
    Assert.isTrue(document.positionAt(5).equals(new TextPosition(1, 1)));
    Assert.isTrue(document.positionAt(3).equals(new TextPosition(0, 2)));
    Assert.isTrue(document.positionAt(4).equals(new TextPosition(1, 0)));
    Assert.isTrue(document.positionAt(9).equals(new TextPosition(2, 2)));
  }

  @TestMethod
  public refusesALineColumnOrOffsetOutsideTheDocument(): void {
    const document = TextDocument.fromText("ab\ncd");

    Expect.throwsWhere(() => document.lineText(2), ArgumentOutOfRangeException, error => error.message.startsWith("Line 2 is outside the document's 2 lines."));
    Assert.throws(() => document.lineEnding(-1), ArgumentOutOfRangeException);
    Expect.throwsWhere(() => document.offsetAt(new TextPosition(1, 3)), ArgumentOutOfRangeException, error => error.message.startsWith("Column 3 is outside line 1, which is 2 characters long."));
    Expect.throwsWhere(() => document.positionAt(6), ArgumentOutOfRangeException, error => error.message.startsWith("Offset 6 is outside the document's 5 characters."));
    Assert.throws(() => document.positionAt(-1), ArgumentOutOfRangeException);
    Assert.throws(() => document.textIn(TextRange.of(0, 0, 2, 0)), ArgumentOutOfRangeException);
  }

  @TestMethod
  public givesTheTextInARangeOnOneLineOrAcrossLines(): void {
    const document = TextDocument.fromText("abc\r\ndef\nghi");

    Assert.areEqual("bc", document.textIn(TextRange.of(0, 1, 0, 3)));
    Assert.areEqual("c\r\ndef\ng", document.textIn(TextRange.of(0, 2, 2, 1)));
    Assert.areEqual("bc\r\nde", document.textIn(TextRange.of(0, 1, 1, 2)));
  }

  @TestMethod
  public appliesAnEditCountsAVersionAndGivesTheEditsOldAndNewRanges(): void {
    const document = TextDocument.fromText("one\ntwo\nthree");

    const change = document.apply(new List([TextDocumentTests.edit(0, 1, 2, 2, "X\nY")]));

    Assert.areEqual("oX\nYree", document.text());
    Assert.areEqual(1, document.version);
    Assert.areEqual(1, change.version);
    Assert.areEqual(1, change.edits.count());
    const applied = change.edits.tryGet(0);
    Assert.isDefined(applied);
    Assert.isTrue(applied.oldRange.equals(TextRange.of(0, 1, 2, 2)));
    Assert.isTrue(applied.newRange.equals(TextRange.of(0, 1, 1, 1)));
    Assert.areEqual("ne\ntwo\nth", applied.oldText);
    Assert.areEqual("X\nY", applied.text);
  }

  @TestMethod
  public tellsEachListenerOfEveryChangeWithEachEditsOldOffsetUntilItStopsListening(): void {
    const document = TextDocument.fromText("ab\r\ncd");
    const heard: string[] = [];
    const stop = document.onChange(t => heard.push(t.edits.select(e => `${t.version} ${e.oldOffset} ${e.oldText}>${e.text}`).toArray().join(",")));

    document.apply(new List([TextDocumentTests.edit(1, 1, 1, 2, "D"), TextDocumentTests.edit(0, 0, 0, 0, "_")]));
    stop();
    document.apply(new List([TextDocumentTests.edit(0, 0, 0, 1, "")]));

    Expect.same(["1 0 >_,1 5 d>D"], heard);
    Assert.areEqual("b\r\n", document.textBetween(1, 4));
  }

  @TestMethod
  public keepsTheReplacedLinesBreakWhenAnEditEndsOnIt(): void {
    const document = TextDocument.fromText("ab\r\ncd\r\nef");

    document.apply(new List([TextDocumentTests.edit(0, 1, 1, 1, "Z")]));

    Assert.areEqual("aZd\r\nef", document.text());
  }

  @TestMethod
  public appliesEditsGivenInAnyOrderAgainstTheSameVersionWithEachNewRangeInTheResult(): void {
    const document = TextDocument.fromText("abc\ndef");

    const change = document.apply(new List([TextDocumentTests.edit(1, 1, 1, 2, "!"), TextDocumentTests.edit(0, 2, 0, 2, "YY\nZ"), TextDocumentTests.edit(0, 1, 0, 1, "X")]));

    Assert.areEqual("aXbYY\nZc\nd!f", document.text());
    Expect.same([TextRange.of(0, 1, 0, 2), TextRange.of(0, 3, 1, 1), TextRange.of(2, 1, 2, 2)], change.edits.select(t => t.newRange).toArray());
    Expect.same(["X", "YY\nZ", "!"], change.edits.select(t => document.textIn(t.newRange)).toArray());
  }

  @TestMethod
  public insertsEditsAtTheSamePositionInTheOrderGiven(): void {
    const document = TextDocument.fromText("ab");

    document.apply(new List([TextDocumentTests.edit(0, 1, 0, 1, "1"), TextDocumentTests.edit(0, 1, 0, 1, "2")]));

    Assert.areEqual("a12b", document.text());
  }

  @TestMethod
  public refusesOverlappingEditsAndLeavesTheDocumentAsItWas(): void {
    const document = TextDocument.fromText("abcdef");

    Expect.throwsWhere(() => document.apply(new List([TextDocumentTests.edit(0, 3, 0, 5, "x"), TextDocumentTests.edit(0, 1, 0, 4, "y")])), EditsOverlapException, error => error.second.start.column === 3);
    Assert.areEqual("abcdef", document.text());
    Assert.areEqual(0, document.version);
  }

  @TestMethod
  public refusesATransactionWithNoEditsOrWithAnEditOutsideTheDocument(): void {
    const document = TextDocument.fromText("abc");

    Assert.throws(() => document.apply(new List<TextEdit>()), ArgumentException);
    Assert.throws(() => document.apply(new List([TextDocumentTests.edit(0, 0, 0, 4, "")])), ArgumentOutOfRangeException);
    Assert.throws(() => document.apply(new List([TextDocumentTests.edit(0, 0, 1, 0, "")])), ArgumentOutOfRangeException);
    Assert.areEqual(0, document.version);
  }

  @TestMethod
  public splitsAChunkThatGrowsPastItsSize(): void {
    const text = ReferenceText.lines(2000);
    const document = TextDocument.fromText(text);
    const inserted = TextDocumentTests.edit(10, 0, 10, 0, `${ReferenceText.lines(600)}\n`);

    document.apply(new List([inserted]));

    TextDocumentTests.checkLines(document, ReferenceText.replace(text, inserted));
  }

  @TestMethod
  public dropsTheChunksAnEditEmptiesAndTrimsTheNext(): void {
    const text = ReferenceText.lines(2000);
    const document = TextDocument.fromText(text);
    const removed = TextDocumentTests.edit(10, 2, 1500, 3, "");

    document.apply(new List([removed]));

    TextDocumentTests.checkLines(document, ReferenceText.replace(text, removed));
  }

  @TestMethod
  public mergesAChunkThatShrinksBelowAQuarterOfItsSizeIntoTheNextWhenTheyFit(): void {
    const text = ReferenceText.lines(700);
    const document = TextDocument.fromText(text);
    const removed = TextDocumentTests.edit(0, 0, 450, 0, "");

    document.apply(new List([removed]));

    TextDocumentTests.checkLines(document, ReferenceText.replace(text, removed));
    document.apply(new List([TextDocumentTests.edit(10, 0, 10, 0, "x")]));
    Assert.areEqual("xline 460", document.lineText(10));
  }

  @TestMethod
  public keepsASmallChunkWhenItIsTheLastOneOrTheNextIsTooFull(): void {
    const text = ReferenceText.lines(1100);
    const document = TextDocument.fromText(text);
    const last = TextDocumentTests.edit(1060, 0, 1099, 0, "");
    const first = TextDocumentTests.edit(0, 0, 450, 0, "");

    document.apply(new List([last]));
    document.apply(new List([first]));

    TextDocumentTests.checkLines(document, ReferenceText.replace(ReferenceText.replace(text, last), first));
  }

  @TestMethod
  public matchesAPlainStringThroughManyRandomEditsAcrossChunks(): void {
    const random = new SeededRandom(7);
    let text = ReferenceText.lines(1500);
    const document = TextDocument.fromText(text);
    for (let round = 0; round < 300; round++) {
      const lines = text.split("\n");
      const startLine = random.next(lines.length);
      const endLine = Math.min(lines.length - 1, startLine + random.next(round % 10 === 0 ? 700 : 3));
      const startColumn = random.next((lines[startLine]?.length ?? 0) + 1);
      const endColumn = endLine === startLine ? startColumn + random.next((lines[endLine]?.length ?? 0) - startColumn + 1) : random.next((lines[endLine]?.length ?? 0) + 1);
      const inserted = round % 7 === 0 ? `${ReferenceText.lines(random.next(900))}\n` : ["", "x", "y\nz", "\n"][random.next(4)] ?? "";
      const change = TextDocumentTests.edit(startLine, startColumn, endLine, endColumn, inserted);
      document.apply(new List([change]));
      text = ReferenceText.replace(text, change);
    }
    TextDocumentTests.checkLines(document, text);
  }

  @TestMethod
  public readsEveryLineBreakOffsetAndPositionOfAnOpenedTextAlikeBeforeAndAfterEditsChangeItsChunks(): void {
    const endings: readonly string[] = ["\n", "\r\n", "\r"];
    let text: string = Array.from({ length: 1300 }, (_, i) => `line ${i}${i === 1299 ? "" : endings[i % 3]}`).join("");
    const document: TextDocument = TextDocument.fromText(text);
    const check = (): void => {
      const lines: readonly string[] = text.split(/\r\n|\r|\n/);
      const breaks: readonly string[] = [...text.matchAll(/\r\n|\r|\n/g)].map(t => t[0]);
      Assert.areEqual(text, document.text());
      Assert.areEqual(lines.length, document.lineCount);
      for (const [line, expected] of lines.entries()) {
        const start: number = ReferenceText.offsetAt(text, new TextPosition(line, 0));
        Expect.same([expected, breaks[line] ?? "", start], [document.lineText(line), document.lineEnding(line), document.offsetAt(new TextPosition(line, 0))]);
        for (let column: number = 0; column <= expected.length + Math.max((breaks[line] ?? "").length - 1, 0); column++)
          Assert.isTrue(document.positionAt(start + column).equals(new TextPosition(line, Math.min(column, expected.length))));
      }
    };

    check();
    for (const change of [TextDocumentTests.edit(600, 2, 600, 2, "x\r\ny"), TextDocumentTests.edit(100, 0, 700, 1, ""), TextDocumentTests.edit(5, 3, 5, 3, `${ReferenceText.lines(700)}\r`)]) {
      document.apply(new List([change]));
      text = ReferenceText.replace(text, change);
      check();
    }
  }

  @TestMethod
  public editsTheMiddleOfA1000000LineDocument(): void {
    const document = TextDocument.fromText(ReferenceText.lines(1_000_000));

    document.apply(new List([TextDocumentTests.edit(500_000, 4, 500_001, 4, "!")]));

    Assert.areEqual(999_999, document.lineCount);
    Assert.areEqual("line! 500001", document.lineText(500_000));
    Assert.areEqual("line 999999", document.lineText(999_998));
    Assert.isTrue(document.positionAt(document.offsetAt(new TextPosition(700_000, 3))).equals(new TextPosition(700_000, 3)));
  }

  @TestMethod
  public opensA1000000LineDocumentCopyingEachCharacterIntoOneChunkAndEditsItsMiddleCopyingOnlyTheChunkTheEditReaches(): void {
    const text: string = ReferenceText.lines(1_000_000);

    const watch: ChunkWatch = new ChunkWatch();
    const document: TextDocument = watch.whileOpening(() => TextDocument.fromText(text));
    const copied: readonly number[] = watch.sourceLengths;
    watch.whileEditing(() => {
      for (let line: number = 500_000; line < 500_020; line++)
        document.apply(new List([TextDocumentTests.edit(line, 0, line, 0, "x")]));
    });
    const touched: readonly number[] = watch.replacedLineCounts;

    Assert.areEqual("xline 500019", document.lineText(500_019));
    Assert.areEqual(text.length, copied.reduce((total, t) => total + t, 0));
    Assert.isTrue(copied.length > 1000, `Opening made ${copied.length} chunks.`);
    Assert.areEqual(20, touched.length);
    Assert.isTrue(Math.max(...touched) < 1000, `The edits copied chunks of ${touched.join(", ")} lines.`);
  }

  @TestMethod
  public async opensATextInSlicesPausingBetweenThemAndBeforeItReturnsIntoTheSameDocumentAsOpeningItAtOnce(): Promise<void> {
    const texts: readonly string[] = ["", "a\r\nb\rc\n", "x\n".repeat(512), ReferenceText.lines(100_000)];
    const pauses: number[] = [];

    for (const text of texts) {
      let count: number = 0;
      const sliced: TextDocument = await TextDocument.fromTextAsync(text, () => {
        count++;

        return Promise.resolve();
      });
      const whole: TextDocument = TextDocument.fromText(text);
      pauses.push(count);

      Assert.areEqual(text, sliced.text());
      Assert.areEqual(whole.lineCount, sliced.lineCount);
      Assert.areEqual(whole.lineText(whole.lineCount - 1), sliced.lineText(sliced.lineCount - 1));
      Assert.isTrue(sliced.positionAt(text.length).equals(whole.positionAt(text.length)));
    }

    Expect.same([1, 1, 1, 3], pauses);
  }

  private static edit(startLine: number, startColumn: number, endLine: number, endColumn: number, text: string): TextEdit {
    return new TextEdit(TextRange.of(startLine, startColumn, endLine, endColumn), text);
  }

  private static checkLines(document: TextDocument, text: string): void {
    Assert.areEqual(text, document.text());
    Assert.areEqual(text.length, document.length);
    const lines = text.split(/\r\n|\r|\n/);
    Assert.areEqual(lines.length, document.lineCount);
    for (const line of [0, Math.floor(lines.length / 2), lines.length - 1]) {
      Assert.areEqual(lines[line], document.lineText(line));
      const position = new TextPosition(line, 0);
      Assert.areEqual(ReferenceText.offsetAt(text, position), document.offsetAt(position));
      Assert.isTrue(document.positionAt(ReferenceText.offsetAt(text, position)).equals(position));
    }
  }
}
