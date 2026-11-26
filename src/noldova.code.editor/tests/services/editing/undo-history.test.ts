/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { EditKind, EditTransaction, TextDocument, TextEdit, TextPosition, TextRange, TextSelection, UndoHistory } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class UndoHistoryTests {
  @TestMethod
  public undoesTypingWithinHalfASecondAsOneStepAndRestoresTheCaretItStartedFrom(): void {
    const document = TextDocument.fromText("");
    const history = new UndoHistory(document);

    history.apply(UndoHistoryTests.type("a", 0, 0, 1000));
    history.apply(UndoHistoryTests.type("b", 0, 1, 1200));
    history.apply(UndoHistoryTests.type("c", 0, 2, 1700));

    Assert.areEqual("abc", document.text());
    Expect.same(UndoHistoryTests.caret(0, 0).toArray(), history.undo()?.toArray());
    Assert.areEqual("", document.text());
    Assert.isTrue(!history.canUndo);
  }

  @TestMethod
  public startsANewStepWhenTheKindChangesHalfASecondPassesTimeGoesBackTheCaretJumpsOrTheStepIsSealed(): void {
    const document = TextDocument.fromText("");
    const history = new UndoHistory(document);

    history.apply(UndoHistoryTests.type("a", 0, 0, 0));
    history.apply(new EditTransaction(new List([new TextEdit(TextRange.of(0, 0, 0, 1), "")]), EditKind.Deleting, 10, UndoHistoryTests.caret(0, 1), UndoHistoryTests.caret(0, 0)));
    history.apply(UndoHistoryTests.type("b", 0, 0, 20));
    history.apply(UndoHistoryTests.type("c", 0, 1, 521));
    history.apply(UndoHistoryTests.type("d", 0, 2, 400));
    history.apply(UndoHistoryTests.type("e", 0, 0, 410));
    history.seal();
    history.apply(UndoHistoryTests.type("f", 0, 1, 420));

    Assert.areEqual("efbcd", document.text());
    const texts: string[] = [];
    while (history.canUndo) {
      history.undo();
      texts.push(document.text());
    }
    Expect.same(["ebcd", "bcd", "bc", "b", "", "a", ""], texts);
  }

  @TestMethod
  public neverGroupsOtherEditsSuchAsAPaste(): void {
    const document = TextDocument.fromText("");
    const history = new UndoHistory(document);

    history.apply(UndoHistoryTests.type("one", 0, 0, 0, EditKind.Other));
    history.apply(UndoHistoryTests.type("two", 0, 3, 10, EditKind.Other));
    history.undo();

    Assert.areEqual("one", document.text());
  }

  @TestMethod
  public redoesWhatWasUndoneRestoringTheSelectionsAfterItUntilANewEditClearsIt(): void {
    const document = TextDocument.fromText("a\r\nb");
    const history = new UndoHistory(document);
    const multiple = new EditTransaction(
      new List([new TextEdit(TextRange.of(0, 1, 0, 1), "X\r\n"), new TextEdit(TextRange.of(1, 0, 1, 1), "Y")]),
      EditKind.Other, 0, new List([new TextSelection(new TextPosition(0, 1)), new TextSelection(new TextPosition(1, 0), new TextPosition(1, 1))]), UndoHistoryTests.caret(2, 1));

    history.apply(multiple);
    history.apply(UndoHistoryTests.type("Z", 2, 1, 100));
    Assert.areEqual("aX\r\n\r\nYZ", document.text());

    history.undo();
    Expect.same(multiple.selectionsBefore.toArray(), history.undo()?.toArray());
    Assert.areEqual("a\r\nb", document.text());
    Assert.isTrue(history.canRedo);
    Expect.same(UndoHistoryTests.caret(2, 1).toArray(), history.redo()?.toArray());
    Assert.areEqual("aX\r\n\r\nY", document.text());
    Expect.same(UndoHistoryTests.caret(2, 2).toArray(), history.redo()?.toArray());
    Assert.areEqual("aX\r\n\r\nYZ", document.text());

    history.undo();
    history.apply(UndoHistoryTests.type("Q", 0, 0, 5000));
    Assert.isTrue(!history.canRedo);
    Assert.areEqual(null, history.redo());
    history.undo();
    history.undo();
    Assert.areEqual("a\r\nb", document.text());
    Assert.areEqual(null, history.undo());
  }

  @TestMethod
  public sealsNothingWhenThereIsNoStep(): void {
    const history = new UndoHistory(TextDocument.fromText("x"));

    history.seal();

    Assert.isTrue(!history.canUndo);
  }

  @TestMethod
  public keepsAtMostItsLimitOfStepsDroppingTheOldestAndGroupsWithinItsGroupTime(): void {
    const document = TextDocument.fromText("");
    const history = new UndoHistory(document);
    Expect.same([10000, 500], [history.limit, history.groupMilliseconds]);
    history.groupMilliseconds = 0;

    for (let i = 0; i < 4; i++)
      history.apply(UndoHistoryTests.type(String(i), 0, i, i * 10));
    history.limit = 2;
    history.apply(UndoHistoryTests.type("4", 0, 4, 40));

    Assert.areEqual(2, history.limit);
    Assert.areEqual("01234", document.text());
    history.undo();
    history.undo();
    Assert.areEqual(null, history.undo());
    Assert.areEqual("012", document.text());
  }

  private static caret(line: number, column: number): List<TextSelection> {
    return new List([new TextSelection(new TextPosition(line, column))]);
  }

  private static type(text: string, line: number, column: number, time: number, kind: EditKind = EditKind.Typing): EditTransaction {
    return new EditTransaction(new List([new TextEdit(TextRange.of(line, column, line, column), text)]), kind, time, UndoHistoryTests.caret(line, column), UndoHistoryTests.caret(line, column + text.length));
  }
}
