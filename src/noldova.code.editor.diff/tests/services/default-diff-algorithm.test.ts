/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

import type { DiffSpan } from "@noldova/code.editor";
import { type IReadOnlyList, List } from "@noldova/context.collections";
import { DefaultDiffAlgorithm } from "@noldova/code.editor.diff";
import { Resources } from "@noldova/code.editor.diff/resources.js";

import { Expect } from "../support/expect.js";

@TestClass
export class DefaultDiffAlgorithmTests {
  @TestMethod
  public findsTheChangedLinesAndCharactersWithTheDiffPackage(): void {
    const algorithm: DefaultDiffAlgorithm = new DefaultDiffAlgorithm();

    Expect.same([Resources.defaultAlgorithmId, ["1-2>1-3"], ["1-2>1-2"], []], [algorithm.id, DefaultDiffAlgorithmTests.shapes(algorithm.lines(new List(["a", "b", "c"]), new List(["a", "x", "y", "c"]))),
      DefaultDiffAlgorithmTests.shapes(algorithm.characters("cat", "cut")), algorithm.lines(new List(["a"]), new List(["a"])).toArray()]);
  }

  private static shapes(ranges: IReadOnlyList<DiffSpan>): readonly string[] {
    return ranges.select(t => `${t.originalStart}-${t.originalEnd}>${t.modifiedStart}-${t.modifiedEnd}`).toArray();
  }
}
