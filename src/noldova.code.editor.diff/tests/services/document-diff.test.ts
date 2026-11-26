/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TextDocument, TextEdit, TextRange } from "@noldova/code.editor";
import { DiffSide, DocumentDiff } from "@noldova/code.editor.diff";
import type { ChangeRanges, LineChange } from "@noldova/code.editor.diff";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { ManualRunner } from "../fixtures/manual-runner.fixture.js";
import { WholeAlgorithm } from "../fixtures/whole-algorithm.fixture.js";
import { Expect } from "../support/expect.js";

@TestClass
export class DocumentDiffTests {
  @TestMethod
  public async listsTheChangedLineRangesOfBothSidesInOrderNumbered(): Promise<void> {
    using diff = await DocumentDiffTests.settledDiffAsync("a\nb\nc\nd", "a\nB\nc\nd\ne");

    Expect.same(["0:1-2>1-2:1/1", "1:4-4>4-5:0/1"], DocumentDiffTests.shapes(diff));
  }

  @TestMethod
  public async findsTheChangedCharactersOfAChangeOnEachSideAcrossItsLinesAndKeepsThemUntilTheNextChange(): Promise<void> {
    using diff = await DocumentDiffTests.settledDiffAsync("x\nfoo bar\nbaz\np\na\nb\nq", "x\nfoo qux\nbaz2\np\nc\nq");
    const first: LineChange = diff.changes.get(0);
    const second: LineChange = diff.changes.get(1);
    const firstRanges: ChangeRanges = diff.rangesOf(first);

    Expect.same(["1:4-1:7"], DocumentDiffTests.ranges(firstRanges.original));
    Expect.same(["1:4-1:7", "2:3-2:4"], DocumentDiffTests.ranges(firstRanges.modified));
    Assert.areEqual(firstRanges, diff.rangesOf(first));
    Expect.same(["4:0-5:1"], DocumentDiffTests.ranges(diff.rangesOf(second).original));
    Expect.same(["4:0-4:1"], DocumentDiffTests.ranges(diff.rangesOf(second).modified));
  }

  @TestMethod
  public async findsNoChangedCharactersWhereASideHasNoLinesOrTheChangeIsOverTheLimit(): Promise<void> {
    const long: string = "a".repeat(20001);
    using inserted = await DocumentDiffTests.settledDiffAsync("a", "a\nb");
    using removed = await DocumentDiffTests.settledDiffAsync("a\nb", "a");
    using large = await DocumentDiffTests.settledDiffAsync(long, `${long}b`);

    for (const diff of [inserted, removed, large]) {
      const changeRanges: ChangeRanges = diff.rangesOf(diff.changes.get(0));
      Expect.same([0, 0], [changeRanges.original.count(), changeRanges.modified.count()]);
    }
  }

  @TestMethod
  public async comparesByCharacterUpToTheLimitItIsGivenAndTellsItsListenersWhenTheLimitChanges(): Promise<void> {
    using diff = await DocumentDiffTests.settledDiffAsync("abc", "abd");
    let told: number = 0;
    diff.onChange(() => told++);
    const change: LineChange = diff.changes.get(0);
    const initial: number = diff.characterDiffLimit;

    diff.characterDiffLimit = 5;
    const limited: number = diff.rangesOf(change).original.count();
    diff.characterDiffLimit = 5;
    diff.characterDiffLimit = 6;

    Expect.same([20000, 0, 1, 6, 2], [initial, limited,
      diff.rangesOf(change).original.count(), diff.characterDiffLimit, told]);
  }

  @TestMethod
  public async diffsWithTheAlgorithmItIsGivenForLinesAndForCharacters(): Promise<void> {
    const algorithm: WholeAlgorithm = new WholeAlgorithm();
    using diff = new DocumentDiff(TextDocument.fromText("a\nb"), TextDocument.fromText("a\nc\nd"), algorithm);
    await diff.settledAsync();

    Expect.same(["0:0-2>0-3:2/3"], DocumentDiffTests.shapes(diff));
    Expect.same(["0:0-1:1"], DocumentDiffTests.ranges(diff.rangesOf(diff.changes.get(0)).original));
    Assert.areEqual(algorithm, diff.algorithm);
    Assert.areEqual(1, algorithm.characterCalls);
  }

  @TestMethod
  public async comparesAgainAfterAnEditToEitherSideTellsItsListenersAndDropsTheOldCharacters(): Promise<void> {
    const original: TextDocument = TextDocument.fromText("a\nb");
    const modified: TextDocument = TextDocument.fromText("a\nb");
    using diff = new DocumentDiff(original, modified);
    await diff.settledAsync();
    let told: number = 0;
    const stop: () => void = diff.onChange(() => told++);

    modified.apply(new List([new TextEdit(TextRange.of(1, 0, 1, 1), "c")]));
    await diff.settledAsync();
    const before: ChangeRanges = diff.rangesOf(diff.changes.get(0));
    original.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "z")]));
    await diff.settledAsync();
    stop();
    modified.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "z")]));
    await diff.settledAsync();

    Assert.areEqual(4, told);
    Expect.same(["0:1-2>1-2:1/1"], DocumentDiffTests.shapes(diff));
    Assert.areNotEqual(before, diff.rangesOf(diff.changes.get(0)));
  }

  @TestMethod
  public async stopsFollowingBothSidesOnceDisposedAndCancelsTheRunningDiff(): Promise<void> {
    const runner: ManualRunner = new ManualRunner();
    const original: TextDocument = TextDocument.fromText("a");
    const modified: TextDocument = TextDocument.fromText("a");
    const diff: DocumentDiff = new DocumentDiff(original, modified, undefined, runner);

    diff[Symbol.dispose]();
    modified.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "b")]));
    original.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "c")]));
    await diff.settledAsync();

    Expect.same([[], 1, true], [DocumentDiffTests.shapes(diff), runner.count, runner.canceled(0)]);
  }

  @TestMethod
  public async cancelsOnlyTheRunStillOutWhenDisposedLeavingTheTokensOfRunsThatLanded(): Promise<void> {
    const runner: ManualRunner = new ManualRunner();
    const modified: TextDocument = TextDocument.fromText("a");
    const diff: DocumentDiff = new DocumentDiff(TextDocument.fromText("a"), modified, undefined, runner);

    await runner.answerAsync(0);
    modified.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "b")]));
    diff[Symbol.dispose]();

    Expect.same([2, false, true], [runner.count, runner.canceled(0), runner.canceled(1)]);
  }

  @TestMethod
  public async findsTheChangeALineOfEitherSideIsInAndNoneForALineOutsideEveryChange(): Promise<void> {
    using diff = await DocumentDiffTests.settledDiffAsync("a\nb\nc\nd\ne", "a\nB\nB2\nc\ne");

    Assert.areEqual(0, diff.changeAt(2, DiffSide.Modified)?.index);
    Assert.areEqual(0, diff.changeAt(1, DiffSide.Original)?.index);
    Assert.areEqual(1, diff.changeAt(3, DiffSide.Original)?.index);
    Assert.areEqual(null, diff.changeAt(4, DiffSide.Modified));
    Assert.areEqual(null, diff.changeAt(3, DiffSide.Modified));
    Assert.areEqual(null, diff.changeAt(0, DiffSide.Modified));
  }

  @TestMethod
  public async stepsToTheNextAndThePreviousChangeFromALineWrappingAtTheEnds(): Promise<void> {
    using diff = await DocumentDiffTests.settledDiffAsync("a\nb\nc\nd\ne", "a\nB\nc\nd\nE");

    Assert.areEqual(0, diff.changeAfter(0, DiffSide.Modified)?.index);
    Assert.areEqual(1, diff.changeAfter(1, DiffSide.Original)?.index);
    Assert.areEqual(0, diff.changeAfter(4, DiffSide.Modified)?.index);
    Assert.areEqual(0, diff.changeBefore(4, DiffSide.Modified)?.index);
    Assert.areEqual(1, diff.changeBefore(1, DiffSide.Original)?.index);
  }

  @TestMethod
  public async listsTheUnchangedRegionsItCanHideKeepingContextLinesAroundEachChangeWhenEnoughLinesAreLeftToHide(): Promise<void> {
    const before: readonly string[] = Array.from({ length: 40 }, (_, i) => `line ${i}`);
    const after: readonly string[] = [...before.slice(0, 10), "new a", "new b", ...before.slice(10, 30), "X30", ...before.slice(31)];
    using diff = await DocumentDiffTests.settledDiffAsync(before.join("\n"), after.join("\n"));
    using same = await DocumentDiffTests.settledDiffAsync("a\nb\nc\nd\ne\nf\ng\nh", "a\nb\nc\nd\ne\nf\ng\nh");
    const shapesOf = (minimum: number): readonly string[] => diff.unchangedRegions(3, minimum).select(t => `${t.originalStart}>${t.modifiedStart}:${t.length}`).toArray();

    Expect.same(["0>0:7", "13>15:14", "34>36:6"], shapesOf(3));
    Expect.same(["0>0:7", "13>15:14"], shapesOf(7));
    Expect.same([], same.unchangedRegions(3, 3).toArray());
  }

  @TestMethod
  public async findsNoChangeAtAfterOrBeforeAnyLineOfEqualTexts(): Promise<void> {
    using diff = await DocumentDiffTests.settledDiffAsync("a\nb", "a\nb");

    Assert.areEqual(null, diff.changeAt(0, DiffSide.Modified));
    Assert.areEqual(null, diff.changeAfter(0, DiffSide.Modified));
    Assert.areEqual(null, diff.changeBefore(1, DiffSide.Modified));
  }

  @TestMethod
  public async diffsThroughItsRunnerShowingNoChangesUntilTheResultLandsThenTellingItsListeners(): Promise<void> {
    const runner: ManualRunner = new ManualRunner();
    using diff = new DocumentDiff(TextDocument.fromText("a\nb"), TextDocument.fromText("c\nb"), undefined, runner);
    let told: number = 0;
    diff.onChange(() => told++);

    Expect.same([true, [], 1], [diff.pending, DocumentDiffTests.shapes(diff), runner.count]);
    await runner.answerAsync(0);

    Expect.same([false, false, ["0:0-1>0-1:1/1"], 1], [diff.pending, diff.failed, DocumentDiffTests.shapes(diff), told]);
  }

  @TestMethod
  public async dropsAResultForTextEditedWhileItRanShowsTheOldChangesMovedThroughTheEditMeanwhileAndDiffsAgain(): Promise<void> {
    const runner: ManualRunner = new ManualRunner();
    const modified: TextDocument = TextDocument.fromText("b\nx\ny\nz");
    using diff = new DocumentDiff(TextDocument.fromText("a\nx\ny\nz"), modified, undefined, runner);
    let told: number = 0;
    diff.onChange(() => told++);

    modified.apply(new List([new TextEdit(TextRange.of(2, 0, 2, 1), "c")]));
    Expect.same([true, ["0:2-3>2-3:1/1"], 1], [diff.pending, DocumentDiffTests.shapes(diff), runner.count]);
    await runner.answerAsync(0);
    Expect.same([true, ["0:2-3>2-3:1/1"], 2], [diff.pending, DocumentDiffTests.shapes(diff), runner.count]);
    await runner.answerAsync(1);

    Expect.same([false, ["0:0-1>0-1:1/1", "1:2-3>2-3:1/1"], 2], [diff.pending, DocumentDiffTests.shapes(diff), told]);
  }

  @TestMethod
  public async keepsTheMappedChangesAndSaysItFailedWhenItsRunnerFailsThenDiffsAgainAfterTheNextEdit(): Promise<void> {
    const runner: ManualRunner = new ManualRunner();
    const modified: TextDocument = TextDocument.fromText("c\nb");
    using diff = new DocumentDiff(TextDocument.fromText("a\nb"), modified, undefined, runner);
    let told: number = 0;
    diff.onChange(() => told++);

    await runner.failAsync(0);
    Expect.same([false, true, [], 1], [diff.pending, diff.failed, DocumentDiffTests.shapes(diff), told]);
    modified.apply(new List([new TextEdit(TextRange.of(1, 0, 1, 1), "d")]));
    Expect.same([true, ["0:1-2>1-2:1/1"], 2], [diff.pending, DocumentDiffTests.shapes(diff), runner.count]);
    await runner.answerAsync(1);

    Expect.same([false, false, ["0:0-2>0-2:2/2"]], [diff.pending, diff.failed, DocumentDiffTests.shapes(diff)]);
  }

  @TestMethod
  public async waitsUntilNoDiffIsRunningWhenAskedToSettle(): Promise<void> {
    const runner: ManualRunner = new ManualRunner();
    const modified: TextDocument = TextDocument.fromText("b");
    using diff = new DocumentDiff(TextDocument.fromText("a"), modified, undefined, runner);
    let settled: boolean = false;
    const settling: Promise<void> = diff.settledAsync().then(() => {
      settled = true;
    });

    modified.apply(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "c")]));
    await runner.answerAsync(0);
    Assert.isFalse(settled);
    await runner.answerAsync(1);
    await settling;

    Expect.same([true, false], [settled, diff.pending]);
  }

  @TestMethod
  public async ignoresAResultOrAFailureThatLandsAfterItIsDisposed(): Promise<void> {
    const runner: ManualRunner = new ManualRunner();
    const answered: DocumentDiff = new DocumentDiff(TextDocument.fromText("a"), TextDocument.fromText("b"), undefined, runner);
    const failed: DocumentDiff = new DocumentDiff(TextDocument.fromText("a"), TextDocument.fromText("b"), undefined, runner);
    let told: number = 0;
    answered.onChange(() => told++);
    failed.onChange(() => told++);

    answered[Symbol.dispose]();
    failed[Symbol.dispose]();
    await runner.answerAsync(0);
    await runner.failAsync(1);

    Expect.same([[], [], false, 2], [DocumentDiffTests.shapes(answered), DocumentDiffTests.shapes(failed), failed.failed, told]);
  }

  private static shapes(diff: DocumentDiff): readonly string[] {
    return diff.changes.select(t => `${t.index}:${t.originalStart}-${t.originalEnd}>${t.modifiedStart}-${t.modifiedEnd}:${t.originalLength}/${t.modifiedLength}`).toArray();
  }

  private static ranges(values: IReadOnlyList<TextRange>): readonly string[] {
    return values.select(t => `${t.start.line}:${t.start.column}-${t.end.line}:${t.end.column}`).toArray();
  }

  private static async settledDiffAsync(original: string, modified: string): Promise<DocumentDiff> {
    const diff: DocumentDiff = new DocumentDiff(TextDocument.fromText(original), TextDocument.fromText(modified));
    await diff.settledAsync();

    return diff;
  }
}
