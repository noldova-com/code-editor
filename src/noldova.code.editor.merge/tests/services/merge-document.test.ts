/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { EditKind, EditTransaction, TextEdit, TextPosition, TextRange, TextSelection } from "@noldova/code.editor";
import { ConflictChoice, ConflictMarkersException, ConflictState, MergeDocument } from "@noldova/code.editor.merge";
import { List } from "@noldova/context.collections";

import { Expect } from "../support/expect.js";

@TestClass
export class MergeDocumentTests {
  @TestMethod
  public mergesTheChangesOfOneSideOrTheSameChangeOnBothWithNoConflict(): void {
    const merge = MergeDocument.fromSides("a\nb\nc\nd\n", "a\nB\nc\nd\n", "a\nB\nc\nD\nE");

    Assert.areEqual("a\nB\nc\nD\nE", merge.document.text());
    Assert.areEqual(0, merge.conflicts.count());
    Assert.areEqual(0, merge.unresolvedCount());
  }

  @TestMethod
  public startsEachConflictUnresolvedWithTheBasesTextAndFindsItByOffset(): void {
    const merge = MergeDocumentTests.conflicted();

    Assert.areEqual("a\nb\nc\n", merge.document.text());
    Expect.same([["b\n", "X\n", "Y\n", 2, 4]], merge.conflicts.select(t => [t.base, t.ours, t.theirs, t.start, t.end]).toArray());
    Assert.areEqual(ConflictState.Unresolved, merge.stateOf(0));
    Assert.areEqual(1, merge.unresolvedCount());
    Assert.areEqual(0, merge.conflictAt(3));
    Assert.areEqual(0, merge.conflictAt(4));
    Assert.areEqual(null, merge.conflictAt(1));
  }

  @TestMethod
  public acceptsASideOrBothInEitherOrderAsOneUndoableStepThatRestoresTheConflict(): void {
    const merge = MergeDocumentTests.conflicted();

    merge.accept(0, ConflictChoice.Ours, 0);
    Assert.areEqual("a\nX\nc\n", merge.document.text());
    Assert.areEqual(ConflictState.Ours, merge.stateOf(0));
    Assert.areEqual(0, merge.unresolvedCount());
    merge.accept(0, ConflictChoice.BothTheirsFirst, 10);
    Assert.areEqual("Y\nX\n", merge.conflictText(0));
    Assert.areEqual(ConflictState.BothTheirsFirst, merge.stateOf(0));
    merge.accept(0, ConflictChoice.BothOursFirst, 20);
    Assert.areEqual(ConflictState.BothOursFirst, merge.stateOf(0));
    merge.accept(0, ConflictChoice.Theirs, 30);
    Assert.areEqual(ConflictState.Theirs, merge.stateOf(0));

    merge.history.undo();
    Assert.areEqual(ConflictState.BothOursFirst, merge.stateOf(0));
    merge.history.undo();
    merge.history.undo();
    merge.history.undo();
    Assert.areEqual("a\nb\nc\n", merge.document.text());
    Assert.areEqual(ConflictState.Unresolved, merge.stateOf(0));
    merge.history.redo();
    Assert.areEqual(ConflictState.Ours, merge.stateOf(0));
  }

  @TestMethod
  public acceptsASideForEveryUnresolvedConflictAsOneUndoableStepLeavingResolvedOnesAsTheyAre(): void {
    const merge = MergeDocument.fromSides("a\nb\nc\nd\ne\n", "a\nX1\nc\nX2\ne\n", "a\nY1\nc\nY2\ne\n");
    merge.accept(1, ConflictChoice.Ours, 0);

    merge.acceptAll(ConflictChoice.Theirs, 10);
    Assert.areEqual("a\nY1\nc\nX2\ne\n", merge.document.text());
    Expect.same([ConflictState.Theirs, ConflictState.Ours], [merge.stateOf(0), merge.stateOf(1)]);
    Assert.areEqual(null, merge.acceptAll(ConflictChoice.Ours, 20));

    merge.history.undo();
    Assert.areEqual("a\nb\nc\nX2\ne\n", merge.document.text());
    Expect.same([ConflictState.Unresolved, ConflictState.Ours], [merge.stateOf(0), merge.stateOf(1)]);
  }

  @TestMethod
  public marksASuggestedTextUntilThePersonEditsItAndResetsToTheBase(): void {
    const merge = MergeDocumentTests.conflicted();

    merge.setConflictText(0, "S\n", 0);
    Assert.areEqual(ConflictState.Suggested, merge.stateOf(0));
    MergeDocumentTests.edit(merge, 10, MergeDocumentTests.replace(merge, 3, 3, "!"));
    Assert.areEqual("S!\n", merge.conflictText(0));
    Assert.areEqual(ConflictState.Edited, merge.stateOf(0));
    merge.reset(0, 20);
    Assert.areEqual("b\n", merge.conflictText(0));
    Assert.areEqual(ConflictState.Unresolved, merge.stateOf(0));
  }

  @TestMethod
  public keepsTextTypedRightBeforeOrAfterAConflictOutOfItAndMovesItWithEditsBeforeIt(): void {
    const merge = MergeDocumentTests.conflicted();

    MergeDocumentTests.edit(merge, 0, MergeDocumentTests.replace(merge, 0, 0, "11"), MergeDocumentTests.replace(merge, 2, 2, "<"), MergeDocumentTests.replace(merge, 4, 4, ">"));

    Assert.areEqual("11a\n<b\n>c\n", merge.document.text());
    Expect.same([5, 7], [merge.conflicts.tryGet(0)?.start, merge.conflicts.tryGet(0)?.end]);
    Assert.areEqual(ConflictState.Unresolved, merge.stateOf(0));
  }

  @TestMethod
  public growsAConflictOverADeletionThatCrossesItsStartOrItsEndAndShrinksItForOneInside(): void {
    const merge = MergeDocument.fromSides("a\nb\nc\nd\n", "a\nX\nY\nd\n", "a\nP\nQ\nd\n");
    Expect.same([2, 6], [merge.conflicts.tryGet(0)?.start, merge.conflicts.tryGet(0)?.end]);

    MergeDocumentTests.edit(merge, 0, MergeDocumentTests.replace(merge, 1, 3, ""));
    Expect.same([1, 4], [merge.conflicts.tryGet(0)?.start, merge.conflicts.tryGet(0)?.end]);
    MergeDocumentTests.edit(merge, 10, MergeDocumentTests.replace(merge, 3, 5, "ZZZ"));
    Expect.same([1, 6], [merge.conflicts.tryGet(0)?.start, merge.conflicts.tryGet(0)?.end]);
    MergeDocumentTests.edit(merge, 20, MergeDocumentTests.replace(merge, 2, 4, ""));
    Expect.same([1, 4], [merge.conflicts.tryGet(0)?.start, merge.conflicts.tryGet(0)?.end]);
    Assert.areEqual(ConflictState.Edited, merge.stateOf(0));
  }

  @TestMethod
  public takesTextTypedIntoAnEmptyConflictIntoIt(): void {
    const merge = MergeDocument.fromSides("a\n", "a\nX\n", "a\nY\n");
    Expect.same([2, 2], [merge.conflicts.tryGet(0)?.start, merge.conflicts.tryGet(0)?.end]);

    MergeDocumentTests.edit(merge, 0, MergeDocumentTests.replace(merge, 2, 2, "T\n"));

    Assert.areEqual("T\n", merge.conflictText(0));
    Assert.areEqual(ConflictState.Edited, merge.stateOf(0));
    merge.history.undo();
    merge.accept(0, ConflictChoice.Theirs, 10);
    Assert.areEqual("a\nY\n", merge.document.text());
  }

  @TestMethod
  public putsALineBreakBetweenBothSidesWhenTheFirstEndsTheFileWithoutOne(): void {
    const merge = MergeDocument.fromSides("a\nb", "a\nX", "a\nY");

    merge.accept(0, ConflictChoice.Ours, 0);
    Assert.areEqual("a\nX", merge.document.text());
    merge.accept(0, ConflictChoice.BothOursFirst, 10);

    Assert.areEqual("a\nX\nY", merge.document.text());
    Expect.same([new TextSelection(new TextPosition(1, 0))], merge.history.undo()?.toArray());
    Expect.same([new TextSelection(new TextPosition(2, 1))], merge.history.redo()?.toArray());
  }

  @TestMethod
  public startsFromGitsMergedFileWithTheConflictsItsMarkersMark(): void {
    const merge = MergeDocument.fromMarkers("a\n<<<<<<< HEAD\nX\n||||||| base\nb\n=======\nY\n>>>>>>> topic\nc\n");

    Assert.areEqual("a\nb\nc\n", merge.document.text());
    merge.accept(0, ConflictChoice.Theirs, 0);
    Assert.areEqual("a\nY\nc\n", merge.document.text());
  }

  @TestMethod
  public readsGitsMergedFileIntoAMergeOrGivesBackTheLineItsMarkersBreakAt(): void {
    const merge = MergeDocument.readMarkers("a\n<<<<<<< HEAD\nX\n=======\nY\n>>>>>>> topic\n");
    const refused = MergeDocument.readMarkers("a\n<<<<<<< HEAD\nX\n");

    Assert.isTrue(merge instanceof MergeDocument);
    Assert.areEqual(1, merge.conflicts.count());
    Assert.isTrue(refused instanceof ConflictMarkersException);
    Assert.areEqual(2, refused.line);
  }

  private static edit(merge: MergeDocument, time: number, ...edits: readonly TextEdit[]): void {
    merge.history.apply(new EditTransaction(new List(edits), EditKind.Other, time, new List<TextSelection>(), new List<TextSelection>()));
  }

  private static replace(merge: MergeDocument, start: number, end: number, text: string): TextEdit {
    return new TextEdit(new TextRange(merge.document.positionAt(start), merge.document.positionAt(end)), text);
  }

  private static conflicted(): MergeDocument {
    return MergeDocument.fromSides("a\nb\nc\n", "a\nX\nc\n", "a\nY\nc\n");
  }
}
