/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";
import { TestClass, TestMethod } from "@noldova/context.testing";

import { PositionMapper, TextEdit, TextPosition, TextRange } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class PositionMapperTests {
  @TestMethod
  public mapsPositionsBeforeInsideAndAfterEditsOnAnEditsLinesAndBelowThem(): void {
    const mapper = new PositionMapper(new List([
      new TextEdit(TextRange.of(1, 4, 1, 4), "X\nYZ"),
      new TextEdit(TextRange.of(0, 1, 0, 3), "a"),
      new TextEdit(TextRange.of(1, 6, 2, 2), "Q")
    ]));

    Expect.same(["0:0", "0:2", "0:4", "2:2", "2:3", "2:5", "2:7", "3:1", "1:2"], [[0, 0], [0, 2], [0, 5], [1, 4], [1, 5], [2, 2], [2, 4], [3, 1], [1, 2]].map(([line, column]) => {
      const mapped = mapper.map(new TextPosition(line ?? 0, column ?? 0));

      return `${mapped.line}:${mapped.column}`;
    }));
  }
}
