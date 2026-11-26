/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

import { DiffSpan } from "@noldova/code.editor";
import { LineChange, LineChangeCodec } from "@noldova/code.editor.diff";
import { type IReadOnlyList, List } from "@noldova/context.collections";

import { Expect } from "../support/expect.js";

@TestClass
export class LineChangeCodecTests {
  @TestMethod
  public packsLineChangesIntoFourNumbersEachAndReadsThemBackNumbered(): void {
    const values: Int32Array = LineChangeCodec.encode(new List([new LineChange(0, 1, 2, 1, 3), new LineChange(1, 5, 5, 6, 7)]));

    Expect.same([1, 2, 1, 3, 5, 5, 6, 7], [...values]);
    Expect.same([[0, 1, 2, 1, 3], [1, 5, 5, 6, 7]], LineChangeCodec.decode(values).select(t => [t.index, t.originalStart, t.originalEnd, t.modifiedStart, t.modifiedEnd]).toArray());
    Expect.same([], LineChangeCodec.decode(LineChangeCodec.encode(new List<DiffSpan>())).toArray());
  }

  @TestMethod
  public packsAnyDiffRangesAndFillsOnlyTheSliceItIsGiven(): void {
    const ranges: IReadOnlyList<DiffSpan> = new List([new DiffSpan(0, 1, 0, 2), new DiffSpan(4, 4, 5, 6)]);
    const values: Int32Array = new Int32Array(ranges.count() * LineChangeCodec.width);

    LineChangeCodec.encodeInto(values, ranges, 1, 2);

    Expect.same([4, 0, 0, 0, 0, 4, 4, 5, 6], [LineChangeCodec.width, ...values]);
  }
}
