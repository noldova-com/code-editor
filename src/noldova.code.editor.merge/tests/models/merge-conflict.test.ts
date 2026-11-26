/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { ConflictChoice, ConflictState, MergeConflict } from "@noldova/code.editor.merge";

@TestClass
export class MergeConflictTests {
  @TestMethod
  public takesBothSidesAsTheOneSideThatIsntEmpty(): void {
    const conflict = new MergeConflict(0, "b\n", "", "Y\n", 0, 2);

    Assert.areEqual("Y\n", conflict.choiceText(ConflictChoice.BothOursFirst));
    Assert.areEqual("Y\n", conflict.choiceText(ConflictChoice.BothTheirsFirst));
  }

  @TestMethod
  public namesTheStateItsTextMatchesASuggestionFirstAndAnythingElseEdited(): void {
    const conflict = new MergeConflict(0, "b\n", "X\n", "Y\n", 0, 2);

    Assert.areEqual(null, conflict.suggestion);
    conflict.suggest("X\n");
    Assert.areEqual("X\n", conflict.suggestion);
    Assert.areEqual(ConflictState.Suggested, conflict.stateFor("X\n"));
    Assert.areEqual(ConflictState.Theirs, conflict.stateFor("Y\n"));
    Assert.areEqual(ConflictState.Edited, conflict.stateFor("other\n"));
  }
}
