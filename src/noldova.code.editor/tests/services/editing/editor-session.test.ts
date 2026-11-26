/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CommandContext, ConditionValues, CoreCommands, CoreContribution, EditorFeatures, EditorFeatureSet, EditorRegistries, EditorSession, TextDocument, TextEdit, TextPosition, TextRange, TextSelection, UndoHistory } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class EditorSessionTests {
  @TestMethod
  public startsWithACaretAtTheStartAndPlacesExtendsAndAddsCaretsClampedToTheText(): void {
    const editor = EditorSessionTests.session("abc\nde");
    Expect.same(["0:0>0:0"], EditorSessionTests.shown(editor));

    editor.placeCaret(EditorSessionTests.at(0, 9), false, false);
    Expect.same(["0:3>0:3"], EditorSessionTests.shown(editor));
    editor.placeCaret(EditorSessionTests.at(5, 1), true, false);
    Expect.same(["0:3>1:1"], EditorSessionTests.shown(editor));
    editor.placeCaret(EditorSessionTests.at(0, 1), false, true);
    Expect.same(["0:1>0:1", "0:3>1:1"], EditorSessionTests.shown(editor));
    Expect.same("1:1", `${editor.primary.head.line}:${editor.primary.head.column}`);
  }

  @TestMethod
  public movesEveryCaretByCharactersWordsLinesPagesLineEndsAndTheDocumentsEnds(): void {
    const editor = EditorSessionTests.session("one two\nthree\nfour\nfive");
    const moves: readonly string[] = [
      CoreCommands.cursorRight.id, CoreCommands.cursorWordRight.id, CoreCommands.cursorLeft.select.id, CoreCommands.cursorWordLeft.id,
      CoreCommands.cursorEnd.id, CoreCommands.cursorHome.id, CoreCommands.cursorBottom.id, CoreCommands.cursorTop.select.id,
      CoreCommands.cursorPageDown.id, CoreCommands.cursorPageUp.id, CoreCommands.selectAll.id
    ];

    Expect.same(["0:1>0:1", "0:3>0:3", "0:3>0:2", "0:0>0:0", "0:7>0:7", "0:0>0:0", "3:4>3:4", "3:4>0:0", "1:0>1:0", "0:0>0:0", "0:0>3:4"], moves.map(t => {
      Assert.areEqual(true, EditorSessionTests.run(editor, t, 0));

      return EditorSessionTests.shown(editor).join();
    }));
  }

  @TestMethod
  public keepsEachCaretsGoalColumnThroughShorterLinesUntilAnotherMoveOrAMergeOfCarets(): void {
    const editor = EditorSessionTests.session("abcdef\nab\nabcdef\nx");
    editor.placeCaret(EditorSessionTests.at(0, 5), false, false);

    EditorSessionTests.run(editor, CoreCommands.cursorDown.id);
    Expect.same(["1:2>1:2"], EditorSessionTests.shown(editor));
    EditorSessionTests.run(editor, CoreCommands.cursorDown.id);
    Expect.same(["2:5>2:5"], EditorSessionTests.shown(editor));
    EditorSessionTests.run(editor, CoreCommands.cursorLeft.id);
    EditorSessionTests.run(editor, CoreCommands.cursorUp.id);
    EditorSessionTests.run(editor, CoreCommands.cursorUp.id);
    Expect.same(["0:4>0:4"], EditorSessionTests.shown(editor));
    editor.placeCaret(EditorSessionTests.at(1, 0), false, true);
    EditorSessionTests.run(editor, CoreCommands.cursorUp.id);
    EditorSessionTests.run(editor, CoreCommands.cursorDown.id);
    Expect.same(["1:0>1:0"], EditorSessionTests.shown(editor));
  }

  @TestMethod
  public typesBreaksLinesIndentsOutdentsAndDeletesAtEveryCaretUndoesAndRedoesAndCollapsesCaretsWithEscape(): void {
    const editor = EditorSessionTests.session("ab\ncd");
    editor.placeCaret(EditorSessionTests.at(0, 2), false, false);
    editor.placeCaret(EditorSessionTests.at(1, 2), false, true);

    Assert.areEqual(true, editor.type("x", 0));
    Assert.areEqual("abx\ncdx", editor.document.text());
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.deleteLeft.id));
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.deleteWordLeft.id));
    Assert.areEqual("\n", editor.document.text());
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.undo.id));
    Assert.areEqual("abx\ncdx", editor.document.text());
    Expect.same(["0:3>0:3", "1:3>1:3"], EditorSessionTests.shown(editor));
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.redo.id));
    Assert.areEqual("\n", editor.document.text());
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.redo.id));
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.cancelSelection.id));
    Expect.same(["1:0>1:0"], EditorSessionTests.shown(editor));
    Assert.areEqual(false, EditorSessionTests.run(editor, CoreCommands.cancelSelection.id));

    editor.type("q", 0);
    EditorSessionTests.run(editor, CoreCommands.newLine.id);
    EditorSessionTests.run(editor, CoreCommands.indent.id);
    EditorSessionTests.run(editor, CoreCommands.cursorHome.id);
    EditorSessionTests.run(editor, CoreCommands.deleteRight.id);
    EditorSessionTests.run(editor, CoreCommands.deleteWordRight.id);
    EditorSessionTests.run(editor, CoreCommands.outdent.id);
    Assert.areEqual("\nq\n", editor.document.text());
    EditorSessionTests.run(editor, CoreCommands.indent.id);
    EditorSessionTests.run(editor, CoreCommands.outdent.id);
    Assert.areEqual("\nq\n", editor.document.text());
  }

  @TestMethod
  public movesToColumnZeroAndDeletesToTheLinesStartAndEndThroughTheCommands(): void {
    const editor = EditorSessionTests.session("  ab cd\nef");
    editor.placeCaret(EditorSessionTests.at(0, 5), false, false);

    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.cursorLineStart.select.id));
    Expect.same(["0:5>0:0"], EditorSessionTests.shown(editor));
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.cursorLineStart.id));
    Expect.same(["0:0>0:0"], EditorSessionTests.shown(editor));
    editor.placeCaret(EditorSessionTests.at(0, 5), false, false);
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.deleteAllRight.id));
    Assert.areEqual("  ab \nef", editor.document.text());
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.deleteAllLeft.id));
    Assert.areEqual("\nef", editor.document.text());
    Expect.same(["0:0>0:0"], EditorSessionTests.shown(editor));
  }

  @TestMethod
  public pastesATextAtEveryCaretOrOneLineAtEachWhenTheLinesMatchTheCaretsAndCopiesAndCutsTheSelections(): void {
    const editor = EditorSessionTests.session("ab\r\ncd");
    editor.select(new List([new TextSelection(EditorSessionTests.at(0, 0), EditorSessionTests.at(0, 1)), new TextSelection(EditorSessionTests.at(1, 0), EditorSessionTests.at(1, 1))]));

    Assert.areEqual("a\r\nc", editor.selectedText());
    Assert.areEqual("a\r\nc", editor.cut(0));
    Assert.areEqual("b\r\nd", editor.document.text());
    Assert.areEqual("", editor.cut(0));
    Assert.areEqual(true, editor.paste("1\n2", 0));
    Assert.areEqual("1b\r\n2d", editor.document.text());
    Assert.areEqual(true, editor.paste("xy", 0));
    Assert.areEqual("1xyb\r\n2xyd", editor.document.text());
    Assert.areEqual("", EditorSessionTests.session("ab").selectedText());
    const single = EditorSessionTests.session("ab");
    single.select(new List([new TextSelection(EditorSessionTests.at(0, 0), EditorSessionTests.at(0, 2))]));
    Assert.areEqual("ab", single.selectedText());
  }

  @TestMethod
  public replacesASetOfRangesAsOneUndoableStepAndNothingWhenThereAreNoneOrItIsReadOnly(): void {
    const editor = EditorSessionTests.session("ab ab ab");
    const edits: IReadOnlyList<TextEdit> = new List([new TextEdit(TextRange.of(0, 0, 0, 2), "x"), new TextEdit(TextRange.of(0, 6, 0, 8), "yz")]);

    Assert.areEqual(true, editor.replace(edits, 0));
    Assert.areEqual("x ab yz", editor.document.text());
    Expect.same(["0:1>0:1", "0:7>0:7"], EditorSessionTests.shown(editor));
    Assert.areEqual(false, editor.replace(new List<TextEdit>(), 0));
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.undo.id));
    Assert.areEqual("ab ab ab", editor.document.text());
    editor.readOnly = true;
    Assert.areEqual(false, editor.replace(edits, 0));
    Assert.areEqual("ab ab ab", editor.document.text());
  }

  @TestMethod
  public dropsATextAtAPositionClampedSelectingItAsOneUndoStepAndNothingWhenReadOnly(): void {
    const editor = EditorSessionTests.session("one\ntwo");
    editor.select(new List([new TextSelection(EditorSessionTests.at(0, 1))]));

    Assert.areEqual(true, editor.drop(EditorSessionTests.at(1, 9), "A\nBC", 0));
    Expect.same(["one\ntwoA\nBC", ["1:3>2:2"]], [editor.document.text(), EditorSessionTests.shown(editor)]);
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.undo.id));
    Expect.same(["one\ntwo", ["0:1>0:1"]], [editor.document.text(), EditorSessionTests.shown(editor)]);
    editor.readOnly = true;
    Assert.areEqual(false, editor.drop(EditorSessionTests.at(0, 0), "x", 0));
    Assert.areEqual("one\ntwo", editor.document.text());
  }

  @TestMethod
  public movesARangeOfTextBeforeOrAfterItselfOnItsLineOrAnotherSelectingItThereAsOneUndoStep(): void {
    const editor = EditorSessionTests.session("abcdefgh\nxy");
    const range: TextRange = TextRange.of(0, 2, 0, 5);
    editor.select(new List([new TextSelection(range.start, range.end)]));

    Assert.areEqual(true, editor.moveText(range, EditorSessionTests.at(0, 7), 0));
    Expect.same(["abfgcdeh\nxy", ["0:4>0:7"]], [editor.document.text(), EditorSessionTests.shown(editor)]);
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.undo.id));
    Expect.same(["abcdefgh\nxy", ["0:2>0:5"]], [editor.document.text(), EditorSessionTests.shown(editor)]);
    Assert.areEqual(true, editor.moveText(range, EditorSessionTests.at(0, 0), 0));
    Expect.same(["cdeabfgh\nxy", ["0:0>0:3"]], [editor.document.text(), EditorSessionTests.shown(editor)]);
    Assert.areEqual(true, editor.moveText(TextRange.of(0, 6, 1, 1), EditorSessionTests.at(0, 1), 0));
    Expect.same(["cgh\nxdeabfy", ["0:1>1:1"]], [editor.document.text(), EditorSessionTests.shown(editor)]);
    Assert.areEqual(true, editor.moveText(TextRange.of(0, 0, 0, 2), EditorSessionTests.at(1, 9), 0));
    Expect.same(["h\nxdeabfycg", ["1:7>1:9"]], [editor.document.text(), EditorSessionTests.shown(editor)]);
    Assert.areEqual(true, editor.moveText(TextRange.of(1, 1, 1, 4), EditorSessionTests.at(1, 2), 0));
    Assert.areEqual("h\nxdeabfycg", editor.document.text());
  }

  @TestMethod
  public movesButDoesntEditUndoOrCutWhenReadOnly(): void {
    const editor = EditorSessionTests.session("ab");
    editor.type("x", 0);
    editor.readOnly = true;
    editor.select(new List([new TextSelection(EditorSessionTests.at(0, 0), EditorSessionTests.at(0, 2))]));

    Assert.areEqual(false, editor.type("y", 0));
    Assert.areEqual(false, EditorSessionTests.run(editor, CoreCommands.deleteLeft.id));
    Assert.areEqual("xa", editor.cut(0));
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.undo.id));
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.redo.id));
    Assert.areEqual("xab", editor.document.text());
    Assert.areEqual(true, EditorSessionTests.run(editor, CoreCommands.cursorRight.id));
  }

  private static session(text: string): EditorSession {
    const document = TextDocument.fromText(text);

    return new EditorSession(document, new UndoHistory(document));
  }

  private static at(line: number, column: number): TextPosition {
    return new TextPosition(line, column);
  }

  private static shown(editor: EditorSession): readonly string[] {
    return editor.selections.select(t => `${t.anchor.line}:${t.anchor.column}>${t.head.line}:${t.head.column}`).toArray();
  }

  private static run(editor: EditorSession, command: string, pageLines: number = 10): boolean {
    const registries: EditorRegistries = new EditorRegistries();
    registries.add(new CoreContribution());
    const features: EditorFeatureSet = new EditorFeatureSet();
    features.provide(EditorFeatures.session, editor);
    const context: CommandContext = new CommandContext(registries, new ConditionValues(registries.conditions), features, null, 0, pageLines);

    return registries.commands.run(command, context);
  }
}
