/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

import { LineSplit } from "@noldova/code.editor";

import { Expect } from "../../support/expect.js";

@TestClass
export class LineSplitTests {
  @TestMethod
  public keepsEachLinesOwnBreakLFCRLFOrCR(): void {
    const split = LineSplit.of("a\r\nb\nc\rd");

    Expect.same(["a", "b", "c", "d"], split.texts.toArray());
    Expect.same(["\r\n", "\n", "\r", ""], split.endings.toArray());
  }

  @TestMethod
  public endsWithAnEmptyLineAfterAFinalBreak(): void {
    const split = LineSplit.of("a\n");

    Expect.same(["a", ""], split.texts.toArray());
    Expect.same(["\n", ""], split.endings.toArray());
  }

  @TestMethod
  public givesTheTextBackWhenEachLineIsJoinedWithItsBreak(): void {
    const text: string = "one\r\ntwo\rthree\n\nfour";
    const split = LineSplit.of(text);

    Expect.same(text, split.texts.select((t, i) => t + split.endings.get(i)).toArray().join(""));
    Expect.same(split.texts.count(), split.endings.count());
  }

  @TestMethod
  public givesOneEmptyLineForEmptyText(): void {
    const split = LineSplit.of("");

    Expect.same([""], split.texts.toArray());
    Expect.same([""], split.endings.toArray());
  }
}
