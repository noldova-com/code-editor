/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { EditKind, TextDocument, TextEditing, TextPosition, TextSelection } from "@noldova/code.editor";
import type { EditTransaction } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class TextEditingTests {
  @TestMethod
  public typesAtEveryCaretAndOverEverySelectionLeavingACaretAfterEachInsert(): void {
    const typed = TextEditing.insert(new List([TextEditingTests.at(0, 1), TextEditingTests.span(1, 3, 1, 1), TextEditingTests.at(0, 1)]), "xy", EditKind.Typing, 5);

    Assert.areEqual(EditKind.Typing, typed.kind);
    Assert.areEqual(5, typed.time);
    Expect.same(["axyb\ncxyf", "0:3>0:3", "1:3>1:3"], TextEditingTests.result("ab\ncdef", typed));
    Expect.same(["a1\n2b\n1\n2cd", "1:1>1:1", "3:1>3:1"], TextEditingTests.result("ab\ncd", TextEditing.insert(new List([TextEditingTests.at(0, 1), TextEditingTests.at(1, 0)]), "1\n2", EditKind.Other, 0)));
  }

  @TestMethod
  public putsOneTextAtEachCaretAsAPasteOfAsManyLinesAsCaretsDoes(): void {
    Expect.same(["ab1\ncd2", "0:3>0:3", "1:3>1:3"], TextEditingTests.result("ab\ncd", TextEditing.insertEach(new List([TextEditingTests.at(0, 2), TextEditingTests.at(1, 2)]), new List(["1", "2"]), 0)));
  }

  @TestMethod
  public breaksALineWithTheDocumentsLineBreakAndTheIndentationBeforeTheCaret(): void {
    Expect.same(["  a\r\n  b\r\ncd", "1:2>1:2"], TextEditingTests.result("  ab\r\ncd", TextEditing.newLine(TextDocument.fromText("  ab\r\ncd"), new List([TextEditingTests.at(0, 3)]), 0)));
    Expect.same([" \n  ab", "1:1>1:1"], TextEditingTests.result("  ab", TextEditing.newLine(TextDocument.fromText("  ab"), new List([TextEditingTests.at(0, 1)]), 0)));
  }

  @TestMethod
  public deletesACharacterOrAWordBackwardOrForwardFromEachCaretOrEachSelectionAndNothingAtTheDocumentsEnds(): void {
    const document = TextDocument.fromText("one two\nx");

    Expect.same(["one twx", "0:6>0:6"], TextEditingTests.result("one two\nx", TextEditing.deleteBackward(document, new List([TextEditingTests.at(0, 7), TextEditingTests.at(1, 0)]), false, 0)));
    Expect.same(["e \nx", "0:0>0:0", "0:2>0:2"], TextEditingTests.result("one two\nx", TextEditing.deleteBackward(document, new List([TextEditingTests.at(0, 7), TextEditingTests.span(0, 0, 0, 2)]), true, 0)));
    Expect.same([" twox", "0:0>0:0", "0:4>0:4"], TextEditingTests.result("one two\nx", TextEditing.deleteForward(document, new List([TextEditingTests.at(0, 0), TextEditingTests.at(0, 7)]), true, 0)));
    Expect.same([" two\nx", "0:0>0:0"], TextEditingTests.result("one two\nx", TextEditing.deleteForward(document, new List([TextEditingTests.span(0, 3, 0, 0)]), false, 0)));
    Assert.areEqual(null, TextEditing.deleteForward(document, new List([TextEditingTests.at(1, 1)]), false, 0));
    Assert.areEqual(undefined, TextEditing.deleteBackward(document, new List([TextEditingTests.at(0, 0)]), false, 0)?.kind);
    Assert.areEqual(EditKind.Deleting, TextEditing.deleteForward(document, new List([TextEditingTests.at(0, 0)]), false, 0)?.kind);
  }

  @TestMethod
  public deletesToEachCaretsLineStartOrEndJoiningLinesAtTheEdgeAndEachSelectionAsItIs(): void {
    const text = "one two\nx";
    const document = TextDocument.fromText(text);

    Expect.same(["two\nx", "0:0>0:0"], TextEditingTests.result(text, TextEditing.deleteToLineStart(document, new List([TextEditingTests.at(0, 4)]), 0)));
    Expect.same(["one twox", "0:7>0:7"], TextEditingTests.result(text, TextEditing.deleteToLineStart(document, new List([TextEditingTests.at(1, 0)]), 0)));
    Expect.same(["oe two\nx", "0:1>0:1"], TextEditingTests.result(text, TextEditing.deleteToLineStart(document, new List([TextEditingTests.span(0, 2, 0, 1)]), 0)));
    Expect.same(["one\nx", "0:3>0:3"], TextEditingTests.result(text, TextEditing.deleteToLineEnd(document, new List([TextEditingTests.at(0, 3)]), 0)));
    Expect.same(["one twox", "0:7>0:7"], TextEditingTests.result(text, TextEditing.deleteToLineEnd(document, new List([TextEditingTests.at(0, 7)]), 0)));
    Expect.same(["one two\n", "1:0>1:0"], TextEditingTests.result(text, TextEditing.deleteToLineEnd(document, new List([TextEditingTests.span(1, 1, 1, 0)]), 0)));
    Assert.areEqual(null, TextEditing.deleteToLineStart(document, new List([TextEditingTests.at(0, 0)]), 0));
    Assert.areEqual(null, TextEditing.deleteToLineEnd(document, new List([TextEditingTests.at(1, 1)]), 0));
  }

  @TestMethod
  public indentsAtTheCaretOrEveryLineASelectionCoversButEmptyOnesAndOneItOnlyTouchesAndOutdentsATabOrSpaces(): void {
    const document = TextDocument.fromText("a\n\n\tb\n   c\nd");

    Expect.same(["  \n\n\tb\n   c\nd", "0:2>0:2"], TextEditingTests.result("a\n\n\tb\n   c\nd", TextEditing.indent(document, new List([TextEditingTests.span(0, 0, 0, 1)]), "  ", 0)));
    Expect.same(["  a\n\n  \tb\n   c\nd", "0:3>2:3"], TextEditingTests.result("a\n\n\tb\n   c\nd", TextEditing.indent(document, new List([TextEditingTests.span(0, 1, 2, 1)]), "  ", 0)));
    Expect.same(["a\n\nb\n c\nd", "2:0>4:0"], TextEditingTests.result("a\n\n\tb\n   c\nd", TextEditing.outdent(document, new List([TextEditingTests.span(2, 0, 4, 0)]), "  ", 0)));
    Expect.same(["a\n\n\tb\n c\nd", "3:0>3:0"], TextEditingTests.result("a\n\n\tb\n   c\nd", TextEditing.outdent(document, new List([TextEditingTests.at(3, 0)]), "  ", 0)));
    Assert.areEqual(null, TextEditing.outdent(document, new List([TextEditingTests.at(0, 1)]), "  ", 0));
  }

  private static at(line: number, column: number): TextSelection {
    return new TextSelection(new TextPosition(line, column));
  }

  private static span(anchorLine: number, anchorColumn: number, headLine: number, headColumn: number): TextSelection {
    return new TextSelection(new TextPosition(anchorLine, anchorColumn), new TextPosition(headLine, headColumn));
  }

  private static result(text: string, transaction: EditTransaction | null): readonly string[] {
    Assert.isNotNull(transaction);
    const document = TextDocument.fromText(text);
    document.apply(transaction.edits);

    return [document.text(), ...transaction.selectionsAfter.select(t => `${t.anchor.line}:${t.anchor.column}>${t.head.line}:${t.head.column}`)];
  }
}
