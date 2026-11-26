/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

import { AppliedEdit, TextChange, TextRange } from "@noldova/code.editor";
import { DiffSide, LineChange } from "@noldova/code.editor.diff";
import { ChangeMapper } from "@noldova/code.editor.diff/services/change-mapper.js";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Expect } from "../support/expect.js";

const CHANGES: IReadOnlyList<LineChange> = new List([new LineChange(0, 2, 3, 2, 4), new LineChange(1, 6, 6, 7, 8)]);

@TestClass
export class ChangeMapperTests {
  @TestMethod
  public marksAnEditInAnUnchangedRegionAsAChangeOfTheLinesFacingItOnTheOtherSide(): void {
    Expect.same(["0:2-3>2-4", "1:4-5>5-6", "2:6-6>7-8"], ChangeMapperTests.mapped(DiffSide.Modified, ChangeMapperTests.edit(TextRange.of(5, 0, 5, 1), TextRange.of(5, 0, 5, 1))));
  }

  @TestMethod
  public growsAChangeByTheLinesAnEditInsideItAddsAndMovesTheChangesAfterIt(): void {
    Expect.same(["0:2-3>2-6", "1:6-6>9-10"], ChangeMapperTests.mapped(DiffSide.Modified, ChangeMapperTests.edit(TextRange.of(3, 0, 3, 0), TextRange.of(3, 0, 5, 0))));
  }

  @TestMethod
  public mergesTheChangesAnEditOfTheOriginalSideSpansShrinkingThemByTheLinesItRemoves(): void {
    Expect.same(["0:2-3>2-9"], ChangeMapperTests.mapped(DiffSide.Original, ChangeMapperTests.edit(TextRange.of(2, 0, 6, 0), TextRange.of(2, 0, 2, 0))));
  }

  @TestMethod
  public mapsEveryEditOfAChangeFromTheLastOneBackAndKeepsAnEditBesideAnInsertionApartFromIt(): void {
    Expect.same(["0:0-1>0-1", "1:2-3>2-4", "2:6-6>7-8", "3:7-8>9-11"], ChangeMapperTests.mapped(DiffSide.Modified, ChangeMapperTests.edit(TextRange.of(0, 0, 0, 1), TextRange.of(0, 0, 0, 1)), ChangeMapperTests.edit(TextRange.of(9, 0, 9, 0), TextRange.of(9, 0, 10, 0))));
    Expect.same(["0:2-3>2-4", "1:6-6>7-8", "2:6-7>8-9"], ChangeMapperTests.mapped(DiffSide.Original, ChangeMapperTests.edit(TextRange.of(6, 0, 6, 1), TextRange.of(6, 0, 6, 1))));
  }

  private static edit(oldRange: TextRange, newRange: TextRange): AppliedEdit {
    return new AppliedEdit(oldRange, newRange, "", "", 0);
  }

  private static shapes(changes: IReadOnlyList<LineChange>): readonly string[] {
    return changes.select(t => `${t.index}:${t.originalStart}-${t.originalEnd}>${t.modifiedStart}-${t.modifiedEnd}`).toArray();
  }

  private static mapped(side: DiffSide, ...edits: readonly AppliedEdit[]): readonly string[] {
    return ChangeMapperTests.shapes(ChangeMapper.through(CHANGES, new TextChange(1, new List(edits)), side));
  }
}
