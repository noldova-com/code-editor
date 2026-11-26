/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TextPosition, TextSelection } from "@noldova/code.editor";

@TestClass
export class TextSelectionTests {
  @TestMethod
  public isACaretWhenGivenOnlyAnAnchor(): void {
    const caret = new TextSelection(new TextPosition(1, 2));

    Assert.isTrue(caret.head.equals(caret.anchor));
  }

  @TestMethod
  public equalsASelectionWithTheSameAnchorAndHeadOnly(): void {
    const selection = new TextSelection(new TextPosition(0, 1), new TextPosition(0, 4));

    Assert.isTrue(selection.equals(new TextSelection(new TextPosition(0, 1), new TextPosition(0, 4))));
    Assert.isTrue(!selection.equals(new TextSelection(new TextPosition(0, 4), new TextPosition(0, 1))));
    Assert.isTrue(!selection.equals(new TextSelection(new TextPosition(0, 1), new TextPosition(0, 5))));
  }

  @TestMethod
  public comparesListsOfSelectionsInOrder(): void {
    const first = new TextSelection(new TextPosition(0, 1));
    const second = new TextSelection(new TextPosition(3, 0));

    Assert.isTrue(TextSelection.allEqual(new List([first, second]), new List([first, second])));
    Assert.isTrue(!TextSelection.allEqual(new List([first, second]), new List([second, first])));
    Assert.isTrue(!TextSelection.allEqual(new List([first]), new List([first, second])));
  }
}
