/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { TestClass, TestMethod } from "@noldova/context.testing";

import { SelectionMoves, TextDocument, TextPosition, TextSelection } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

const DOCUMENT = TextDocument.fromText("  foo.bar  baz\n😀x\nlast");

@TestClass
export class SelectionMovesTests {
  @TestMethod
  public movesACaretLeftAndRightByACharacterAcrossLineEndsAndOverASurrogatePairAndStopsAtTheDocumentsEnds(): void {
    Expect.same(["0:2>0:2", "0:14>0:14", "1:0>1:0", "0:0>0:0", "1:2>1:2", "1:0>1:0", "1:3>1:3", "2:4>2:4"], [
      SelectionMoves.left(DOCUMENT, SelectionMovesTests.at(0, 3), false, false),
      SelectionMoves.left(DOCUMENT, SelectionMovesTests.at(1, 0), false, false),
      SelectionMoves.left(DOCUMENT, SelectionMovesTests.at(1, 2), false, false),
      SelectionMoves.left(DOCUMENT, SelectionMovesTests.at(0, 0), false, false),
      SelectionMoves.right(DOCUMENT, SelectionMovesTests.at(1, 0), false, false),
      SelectionMoves.right(DOCUMENT, SelectionMovesTests.at(0, 14), false, false),
      SelectionMoves.right(DOCUMENT, SelectionMovesTests.at(1, 2), false, false),
      SelectionMoves.right(DOCUMENT, SelectionMovesTests.at(2, 4), false, false)
    ].map(SelectionMovesTests.text));
  }

  @TestMethod
  public collapsesASelectionToItsStartOrEndAndExtendsOneFromItsAnchor(): void {
    Expect.same(["0:2>0:2", "0:5>0:5", "0:5>0:1", "0:2>0:6"], [
      SelectionMoves.left(DOCUMENT, SelectionMovesTests.span(0, 5, 0, 2), false, false),
      SelectionMoves.right(DOCUMENT, SelectionMovesTests.span(0, 5, 0, 2), false, false),
      SelectionMoves.left(DOCUMENT, SelectionMovesTests.span(0, 5, 0, 2), true, false),
      SelectionMoves.right(DOCUMENT, SelectionMovesTests.span(0, 2, 0, 5), true, false)
    ].map(SelectionMovesTests.text));
  }

  @TestMethod
  public movesByWordsSkippingSpacesAndTreatingLettersAndPunctuationAsDifferentWords(): void {
    Expect.same(["0:11>0:11", "0:6>0:6", "0:5>0:5", "0:6>0:6", "0:5>0:5", "0:6>0:6", "0:14>0:14"], [
      SelectionMoves.left(DOCUMENT, SelectionMovesTests.at(0, 14), false, true),
      SelectionMoves.left(DOCUMENT, SelectionMovesTests.at(0, 11), false, true),
      SelectionMoves.left(DOCUMENT, SelectionMovesTests.at(0, 6), false, true),
      SelectionMoves.left(DOCUMENT, SelectionMovesTests.span(0, 9, 0, 7), false, true),
      SelectionMoves.right(DOCUMENT, SelectionMovesTests.at(0, 0), false, true),
      SelectionMoves.right(DOCUMENT, SelectionMovesTests.at(0, 5), false, true),
      SelectionMoves.right(DOCUMENT, SelectionMovesTests.at(0, 9), false, true)
    ].map(SelectionMovesTests.text));
  }

  @TestMethod
  public movesUpAndDownToAGoalColumnNotInsideASurrogatePairAndToTheDocumentsEndsPastItsFirstOrLastLine(): void {
    Expect.same(["1:3>1:3", "1:0>1:0", "1:1>2:4", "0:0>0:0", "2:4>2:4", "1:2>1:2"], [
      SelectionMoves.vertical(DOCUMENT, SelectionMovesTests.at(0, 9), 1, 9, false),
      SelectionMoves.vertical(DOCUMENT, SelectionMovesTests.at(2, 0), -1, 1, false),
      SelectionMoves.vertical(DOCUMENT, SelectionMovesTests.at(1, 1), 1, 9, true),
      SelectionMoves.vertical(DOCUMENT, SelectionMovesTests.at(0, 4), -3, 4, false),
      SelectionMoves.vertical(DOCUMENT, SelectionMovesTests.at(2, 1), 5, 1, false),
      SelectionMoves.vertical(DOCUMENT, SelectionMovesTests.at(1, 3), 0, 2, false)
    ].map(SelectionMovesTests.text));
  }

  @TestMethod
  public movesToTheLinesFirstTextAndThenItsStartToItsEndToTheDocumentsEndsAndSelectsAll(): void {
    Expect.same(["0:2>0:2", "0:2>0:0", "0:14>0:14", "1:1>0:0", "2:4>2:4", "0:0>2:4"], [
      SelectionMoves.lineStart(DOCUMENT, SelectionMovesTests.at(0, 9), false),
      SelectionMoves.lineStart(DOCUMENT, SelectionMovesTests.at(0, 2), true),
      SelectionMoves.lineEnd(DOCUMENT, SelectionMovesTests.at(0, 2), false),
      SelectionMoves.documentStart(SelectionMovesTests.at(1, 1), true),
      SelectionMoves.documentEnd(DOCUMENT, SelectionMovesTests.at(1, 1), false),
      SelectionMoves.all(DOCUMENT)
    ].map(SelectionMovesTests.text));
  }

  @TestMethod
  public movesToColumnZeroBeforeTheIndentationOrExtendsTheSelectionThere(): void {
    Expect.same(["0:0>0:0", "0:9>0:0", "1:0>1:0"], [
      SelectionMoves.lineFirstColumn(SelectionMovesTests.at(0, 9), false),
      SelectionMoves.lineFirstColumn(SelectionMovesTests.at(0, 9), true),
      SelectionMoves.lineFirstColumn(SelectionMovesTests.span(0, 3, 1, 2), false)
    ].map(SelectionMovesTests.text));
  }

  @TestMethod
  public mergesOverlappingSelectionsAndCaretsOnASelectionsEdgeKeepingTouchingSelectionsApartAndTheFirstOnesDirection(): void {
    Expect.same(["0:9>0:2", "1:0>1:2", "1:2>1:3", "2:1>2:1"], SelectionMoves.merge(new List([SelectionMovesTests.span(0, 6, 0, 2), SelectionMovesTests.at(0, 4), SelectionMovesTests.span(0, 3, 0, 9), SelectionMovesTests.span(1, 0, 1, 2), SelectionMovesTests.span(1, 2, 1, 3), SelectionMovesTests.at(2, 1), SelectionMovesTests.at(2, 1), SelectionMovesTests.span(0, 6, 0, 7)])).select(SelectionMovesTests.text).toArray());
    Expect.same(["0:1>0:5"], SelectionMoves.merge(new List([SelectionMovesTests.span(0, 1, 0, 5), SelectionMovesTests.at(0, 5)])).select(SelectionMovesTests.text).toArray());
    Expect.same(["0:5>0:8"], SelectionMoves.merge(new List([SelectionMovesTests.at(0, 5), SelectionMovesTests.span(0, 5, 0, 8)])).select(SelectionMovesTests.text).toArray());
  }

  private static at(line: number, column: number): TextSelection {
    return new TextSelection(new TextPosition(line, column));
  }

  private static span(anchorLine: number, anchorColumn: number, headLine: number, headColumn: number): TextSelection {
    return new TextSelection(new TextPosition(anchorLine, anchorColumn), new TextPosition(headLine, headColumn));
  }

  private static text(selection: TextSelection): string {
    return `${selection.anchor.line}:${selection.anchor.column}>${selection.head.line}:${selection.head.column}`;
  }
}
